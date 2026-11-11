"use client";

/**
 * Drag, click and keyboard assignment of color roles. One provider holds everything the swatches (sources) and the
 * role rows (targets) share:
 *
 *  - Pointer drag (mouse, touch and pen) with a floating copy of the swatch and auto scroll near the panel edges.
 *  - Click to pick up: click a swatch, then click a role row (same safety check as a drop).
 *  - Keyboard pick up: Space picks a focused swatch up, the arrow keys move it over a role, Space drops it.
 *  - One cancel path for all of them: Escape, pointer cancel, right click, window blur and the page being hidden
 *    cancel a drag or a held swatch. A cancelled drag ignores the mouse release, and the next drag works normally.
 *  - `assign` runs the safety check first. A drop that would break a rule is not applied; the row shows why.
 *
 * Swatches in the tray are never wired to copy. Outside the provider a DragSwatch is a plain button.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import {
  OVERRIDABLE_ROLES,
  ROLE_ROWS,
  assignRole,
  refLabel,
  resetRoles,
  useDesignSystem,
  type ColorRef,
  type OverridableRole,
  type SwatchSource,
} from "@/lib/design-system";

export interface Rejection {
  message: string;
  suggestion: ColorRef | null;
}

export type HoldMode = "pointer" | "click" | "keyboard";

interface Hold {
  source: SwatchSource;
  mode: HoldMode;
  x: number;
  y: number;
  over: OverridableRole | null;
}

/** What was lost when the secondary color was removed, so Undo can bring it back. */
export interface SecondaryRemoved {
  secondary: string;
  overrides: Partial<Record<OverridableRole, ColorRef>>;
}

interface Dnd {
  hold: Hold | null;
  /** Roles that went back to automatic because the secondary color was removed (with Undo). */
  removed: SecondaryRemoved | null;
  noteSecondaryRemoved: (info: SecondaryRemoved | null) => void;
  undoSecondaryRemoved: () => void;
  rejections: Partial<Record<OverridableRole, Rejection>>;
  /** Applies a swatch to a role after the safety check. Returns true when it was applied. */
  assign: (role: OverridableRole, ref: ColorRef) => boolean;
  dismiss: (role: OverridableRole) => void;
  reset: (role?: OverridableRole) => void;
  announce: (message: string) => void;
  startPointer: (source: SwatchSource, event: PointerEvent) => void;
  /** Click to pick up (mode "click") or Space (mode "keyboard"). */
  pickUp: (source: SwatchSource, mode: "click" | "keyboard") => void;
  /** Places the held swatch on a role (click to pick up, then click a row). */
  place: (role: OverridableRole) => void;
  move: (delta: number) => void;
  drop: () => void;
  cancel: () => void;
}

const Context = createContext<Dnd | null>(null);
export const useRolesDnd = () => useContext(Context);

const withoutRole = (info: SecondaryRemoved | null, role: OverridableRole): SecondaryRemoved | null => {
  if (!info || !(role in info.overrides)) return info;
  const overrides = { ...info.overrides };
  delete overrides[role];
  return Object.keys(overrides).length ? { ...info, overrides } : null;
};
const label = (key: OverridableRole) => ROLE_ROWS.find((row) => row.key === key)!.label;
const roleAt = (point: { x: number; y: number }): OverridableRole | null => {
  const row = document.elementFromPoint(point.x, point.y)?.closest<HTMLElement>("[data-role-row]");
  return (row?.dataset.roleRow as OverridableRole | undefined) ?? null;
};

/** The click that ends a drag must not do anything (no copy, no pick up). Removed if no click comes. */
function suppressNextClick() {
  const stop = (event: Event) => {
    event.stopPropagation();
    event.preventDefault();
    window.removeEventListener("click", stop, true);
  };
  window.addEventListener("click", stop, true);
  setTimeout(() => window.removeEventListener("click", stop, true), 500);
}

export function RolesDnd({ children }: { children: ReactNode }) {
  const { settings, update } = useDesignSystem();
  const [hold, setHold] = useState<Hold | null>(null);
  const [rejections, setRejections] = useState<Dnd["rejections"]>({});
  const [message, setMessage] = useState("");
  const [removed, setRemoved] = useState<SecondaryRemoved | null>(null);
  // The latest values, for handlers that run later (pointer moves outside React).
  const live = useRef({ hold, settings });
  useEffect(() => {
    live.current = { hold, settings };
  });
  /** The running pointer drag, so any cancel can stop it. */
  const drag = useRef<{ abort: () => void } | null>(null);

  const announce = useCallback((text: string) => setMessage(text), []);

  const clearRejection = (role: OverridableRole) =>
    setRejections((current) => {
      const next = { ...current };
      delete next[role];
      return next;
    });

  const assign = useCallback(
    (role: OverridableRole, ref: ColorRef) => {
      const result = assignRole(live.current.settings, role, ref);
      if (!result.ok) {
        setRejections((current) => ({ ...current, [role]: { message: result.message, suggestion: result.suggestion } }));
        announce(`Not applied to ${label(role)}. ${result.message}`);
        return false;
      }
      update({ colors: { roleOverrides: result.settings.colors.roleOverrides ?? {} } });
      clearRejection(role);
      setRemoved((current) => withoutRole(current, role));
      announce(`Dropped on ${label(role)}. ${label(role)} now uses ${refLabel(ref)}.`);
      return true;
    },
    [update, announce],
  );

  const dismiss = useCallback((role: OverridableRole) => clearRejection(role), []);

  // Secondary color removed: remember what the roles pointed at, so the row can say so and offer Undo.
  const noteSecondaryRemoved = useCallback(
    (info: SecondaryRemoved | null) => {
      setRemoved(info);
      if (!info) return;
      const names = Object.keys(info.overrides).map((key) => label(key as OverridableRole));
      announce(`Secondary color was removed, so ${names.join(" and ")} went back to automatic.`);
    },
    [announce],
  );
  const undoSecondaryRemoved = useCallback(() => {
    const info = removed;
    if (!info) return;
    update({ colors: { secondary: info.secondary, roleOverrides: { ...live.current.settings.colors.roleOverrides, ...info.overrides } } });
    setRemoved(null);
    announce("Secondary color and its role assignments are back.");
  }, [removed, update, announce]);

  const reset = useCallback(
    (role?: OverridableRole) => {
      const next = resetRoles(live.current.settings, role);
      update({ colors: { roleOverrides: next.colors.roleOverrides ?? {} } });
      setRemoved((current) => (role ? withoutRole(current, role) : null));
      setRejections((current) => {
        if (!role) return {};
        const copy = { ...current };
        delete copy[role];
        return copy;
      });
      announce(role ? `${label(role)} is automatic again.` : "All roles are automatic again.");
    },
    [update, announce],
  );

  // ---- the one cancel path ------------------------------------------------------------------------------------
  const cancel = useCallback(() => {
    const had = live.current.hold !== null;
    drag.current?.abort();
    drag.current = null;
    if (!had) return;
    setHold(null);
    announce("Cancelled. Nothing changed.");
  }, [announce]);

  // While a swatch is held or dragged: Escape, a right click, the window or page losing focus all cancel.
  const holding = hold !== null;
  useEffect(() => {
    if (!holding) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      cancel();
    };
    const onPointer = (event: PointerEvent) => {
      if (event.button !== 0) cancel();
    };
    const onContext = (event: Event) => {
      event.preventDefault();
      cancel();
    };
    const onHidden = () => {
      if (document.visibilityState === "hidden") cancel();
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("contextmenu", onContext, true);
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", onHidden);
    // No text selection and no grabbing cursor flicker while something is held.
    document.body.classList.add("tool-dragging");
    window.getSelection()?.removeAllRanges();
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("contextmenu", onContext, true);
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", onHidden);
      document.body.classList.remove("tool-dragging");
    };
  }, [holding, cancel]);

  // Leaving the editor (unmount) drops everything.
  useEffect(() => () => drag.current?.abort(), []);

  // ---- pointer drag -------------------------------------------------------------------------------------------
  const scrollRaf = useRef<number | null>(null);
  const startPointer = useCallback(
    (source: SwatchSource, down: PointerEvent) => {
      drag.current?.abort();
      const start = { x: down.clientX, y: down.clientY };
      let dragging = false;
      let ended = false;
      const scroller = (down.target as HTMLElement).closest<HTMLElement>("[data-role-scroll]");
      let pointer = { ...start };

      // Scroll the panel while the pointer rests near its top or bottom edge. At the top the zone starts below the tray
      // (the pointer starts a drag inside the tray, which must not scroll anything), and the pointer must rest there
      // for a moment, so passing through it on the way to the first row does not scroll.
      let zone: "top" | "bottom" | null = null;
      let zoneSince = 0;
      const autoScroll = (now: number) => {
        if (!dragging || ended || !scroller) return;
        const box = scroller.getBoundingClientRect();
        const tray = scroller.querySelector<HTMLElement>("[data-tray]")?.getBoundingClientRect();
        const top = Math.max(box.top, tray ? tray.bottom : box.top);
        // A narrow band under the tray (the first role row must not sit inside it), a wider one at the bottom edge.
        const inZone: "top" | "bottom" | null = pointer.y >= top && pointer.y < top + 20 ? "top" : pointer.y > box.bottom - 40 ? "bottom" : null;
        if (inZone !== zone) {
          zone = inZone;
          zoneSince = now;
        }
        if (zone && now - zoneSince > 250) scroller.scrollTop += zone === "top" ? -10 : 10;
        setHold((current) => (current ? { ...current, over: roleAt(pointer) } : current));
        scrollRaf.current = requestAnimationFrame(autoScroll);
      };

      const cleanup = () => {
        ended = true;
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", pointerCancel);
        if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
        if (drag.current === controller) drag.current = null;
      };
      const move = (event: PointerEvent) => {
        if (ended) return;
        pointer = { x: event.clientX, y: event.clientY };
        if (!dragging) {
          if (Math.hypot(pointer.x - start.x, pointer.y - start.y) < 5) return;
          dragging = true;
          announce(`Dragging ${refLabel(source.ref)}. Escape cancels.`);
          scrollRaf.current = requestAnimationFrame(autoScroll);
        }
        event.preventDefault();
        setHold({ source, mode: "pointer", x: pointer.x, y: pointer.y, over: roleAt(pointer) });
      };
      const up = (event: PointerEvent) => {
        if (ended) return;
        cleanup();
        if (!dragging) return;
        suppressNextClick();
        const target = roleAt({ x: event.clientX, y: event.clientY });
        setHold(null);
        if (target) assign(target, source.ref);
        else announce("Dropped outside a role. Nothing changed.");
      };
      const pointerCancel = () => {
        const was = dragging;
        cleanup();
        if (!was) return;
        suppressNextClick();
        setHold(null);
        announce("Cancelled. Nothing changed.");
      };
      // Cancelled from outside (Escape, right click, blur): stop listening; the release is ignored from here on.
      const controller = {
        abort: () => {
          const was = dragging;
          cleanup();
          if (was) suppressNextClick();
        },
      };
      drag.current = controller;
      window.addEventListener("pointermove", move, { passive: false });
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", pointerCancel);
    },
    [assign, announce],
  );

  // ---- click and keyboard pick up -----------------------------------------------------------------------------
  const pickUp = useCallback(
    (source: SwatchSource, mode: "click" | "keyboard") => {
      setHold({ source, mode, x: 0, y: 0, over: null });
      announce(
        mode === "click"
          ? `Holding ${refLabel(source.ref)}. Click a role to use it. Escape cancels.`
          : `Picked up ${refLabel(source.ref)}. Use the arrow keys to choose a role, Space to drop, Escape to cancel.`,
      );
    },
    [announce],
  );
  const place = useCallback(
    (role: OverridableRole) => {
      const current = live.current.hold;
      if (!current || current.mode === "pointer") return;
      setHold(null);
      assign(role, current.source.ref);
    },
    [assign],
  );
  const move = useCallback(
    (delta: number) => {
      const current = live.current.hold;
      if (!current) return;
      const index = current.over ? OVERRIDABLE_ROLES.indexOf(current.over) : delta > 0 ? -1 : OVERRIDABLE_ROLES.length;
      const next = ROLE_ROWS[Math.min(ROLE_ROWS.length - 1, Math.max(0, index + delta))].key;
      setHold({ ...current, over: next });
      announce(`Over ${label(next)}.`);
      document.querySelector(`[data-role-row="${next}"]`)?.scrollIntoView({ block: "nearest" });
    },
    [announce],
  );
  const drop = useCallback(() => {
    const current = live.current.hold;
    if (!current) return;
    setHold(null);
    if (current.over) assign(current.over, current.source.ref);
    else announce("Not over a role. Nothing changed. Use the arrow keys to choose one, or click a role.");
  }, [assign, announce]);

  const value = useMemo<Dnd>(
    () => ({ hold, removed, noteSecondaryRemoved, undoSecondaryRemoved, rejections, assign, dismiss, reset, announce, startPointer, pickUp, place, move, drop, cancel }),
    [hold, removed, noteSecondaryRemoved, undoSecondaryRemoved, rejections, assign, dismiss, reset, announce, startPointer, pickUp, place, move, drop, cancel],
  );

  return (
    <Context.Provider value={value}>
      {children}
      {hold?.mode === "pointer" ? (
        <span aria-hidden className="tool-float" style={{ left: hold.x + 10, top: hold.y + 10 }}>
          <span className="tool-sample size-6 rounded-[5px]" style={{ background: hold.source.hex }} />
          <span>{refLabel(hold.source.ref)}</span>
        </span>
      ) : null}
      <span className="sr-only" role="status" aria-live="polite">
        {message}
      </span>
    </Context.Provider>
  );
}

/**
 * A tray swatch. Drag it onto a role, or click it and then click a role. Space picks it up for the keyboard flow.
 * It never copies. Without the provider it is a plain button.
 */
export function DragSwatch({ source, onKeyDown, onKeyUp, onPointerDown, onClick, children, ...rest }: { source: SwatchSource } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const dnd = useRolesDnd();
  const held = dnd?.hold?.source.id === source.id;
  return (
    <button
      type="button"
      draggable={false}
      {...rest}
      data-swatch={source.id}
      data-holding={held ? "true" : undefined}
      aria-pressed={dnd ? held : undefined}
      aria-roledescription={dnd ? "draggable swatch" : undefined}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (dnd && event.button === 0) dnd.startPointer(source, event.nativeEvent);
      }}
      onClick={(event) => {
        onClick?.(event);
        if (!dnd || event.defaultPrevented) return;
        // Click to pick up; clicking the held swatch again puts it down.
        if (dnd.hold?.mode === "click" && held) dnd.cancel();
        else dnd.pickUp(source, "click");
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!dnd || event.defaultPrevented) return;
        if (event.key === " ") {
          event.preventDefault();
          if (!dnd.hold) dnd.pickUp(source, "keyboard");
          else if (held) dnd.drop();
        } else if (held && (event.key === "ArrowDown" || event.key === "ArrowRight")) {
          event.preventDefault();
          dnd.move(1);
        } else if (held && (event.key === "ArrowUp" || event.key === "ArrowLeft")) {
          event.preventDefault();
          dnd.move(-1);
        }
      }}
      onKeyUp={(event) => {
        onKeyUp?.(event);
        if (event.key === " " && dnd) event.preventDefault();
      }}
      onBlur={(event) => {
        rest.onBlur?.(event);
        // A swatch picked up with Space is dropped when focus leaves it. Click to pick up survives the click on a row.
        if (held && dnd?.hold?.mode === "keyboard") dnd.cancel();
      }}
    >
      {children}
    </button>
  );
}
