"use client";

/**
 * Drag and drop for color roles. One provider holds everything that is shared between the swatches (sources) and
 * the role rows (targets):
 *
 *  - Pointer drag (mouse, touch and pen) with a floating copy of the swatch and auto scroll near the panel edges.
 *  - Keyboard pick up: Space picks a focused swatch up, the arrow keys move it over a role, Space drops it,
 *    Escape cancels. Every step is announced in a live region.
 *  - `assign`: runs the safety check first. A drop that would break a rule is not applied; the row shows why.
 *
 * Outside the provider (the Colors tile on the board) a swatch is a plain button.
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

interface Hold {
  source: SwatchSource;
  mode: "pointer" | "keyboard";
  x: number;
  y: number;
  over: OverridableRole | null;
}

interface Dnd {
  hold: Hold | null;
  rejections: Partial<Record<OverridableRole, Rejection>>;
  /** Applies a swatch to a role after the safety check. Returns true when it was applied. */
  assign: (role: OverridableRole, ref: ColorRef) => boolean;
  dismiss: (role: OverridableRole) => void;
  reset: (role?: OverridableRole) => void;
  announce: (message: string) => void;
  startPointer: (source: SwatchSource, event: PointerEvent) => void;
  pickUp: (source: SwatchSource) => void;
  move: (delta: number) => void;
  drop: () => void;
  cancel: () => void;
}

const Context = createContext<Dnd | null>(null);
export const useRolesDnd = () => useContext(Context);

const label = (key: OverridableRole) => ROLE_ROWS.find((row) => row.key === key)!.label;
const roleAt = (point: { x: number; y: number }): OverridableRole | null => {
  const row = document.elementFromPoint(point.x, point.y)?.closest<HTMLElement>("[data-role-row]");
  return (row?.dataset.roleRow as OverridableRole | undefined) ?? null;
};

export function RolesDnd({ children }: { children: ReactNode }) {
  const { settings, update } = useDesignSystem();
  const [hold, setHold] = useState<Hold | null>(null);
  const [rejections, setRejections] = useState<Dnd["rejections"]>({});
  const [message, setMessage] = useState("");
  // The latest values, for handlers that run later (pointer moves outside React).
  const live = useRef({ hold, settings });
  useEffect(() => {
    live.current = { hold, settings };
  });

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
      announce(`Dropped on ${label(role)}. ${label(role)} now uses ${refLabel(ref)}.`);
      return true;
    },
    [update, announce],
  );

  const dismiss = useCallback((role: OverridableRole) => clearRejection(role), []);

  const reset = useCallback(
    (role?: OverridableRole) => {
      const next = resetRoles(live.current.settings, role);
      update({ colors: { roleOverrides: next.colors.roleOverrides ?? {} } });
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

  // ---- pointer drag -------------------------------------------------------------------------------------------
  const scrollRaf = useRef<number | null>(null);
  const startPointer = useCallback(
    (source: SwatchSource, down: PointerEvent) => {
      const start = { x: down.clientX, y: down.clientY };
      let dragging = false;
      const scroller = (down.target as HTMLElement).closest<HTMLElement>("[data-role-scroll]");
      let pointer = { ...start };

      // Scroll the panel while the pointer rests near its top or bottom edge.
      const autoScroll = () => {
        if (!dragging || !scroller) return;
        const box = scroller.getBoundingClientRect();
        const edge = 56;
        if (pointer.y < box.top + edge) scroller.scrollTop -= 10;
        else if (pointer.y > box.bottom - edge) scroller.scrollTop += 10;
        setHold((current) => (current ? { ...current, over: roleAt(pointer) } : current));
        scrollRaf.current = requestAnimationFrame(autoScroll);
      };

      const move = (event: PointerEvent) => {
        pointer = { x: event.clientX, y: event.clientY };
        if (!dragging) {
          if (Math.hypot(pointer.x - start.x, pointer.y - start.y) < 5) return;
          dragging = true;
          announce(`Dragging ${refLabel(source.ref)}.`);
          scrollRaf.current = requestAnimationFrame(autoScroll);
        }
        event.preventDefault();
        setHold({ source, mode: "pointer", x: pointer.x, y: pointer.y, over: roleAt(pointer) });
      };
      const finish = (event: PointerEvent, cancelled: boolean) => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", cancel);
        if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
        if (!dragging) return;
        // The click that follows a drag must not copy the hex.
        window.addEventListener("click", (e) => e.stopPropagation(), { capture: true, once: true });
        const target = cancelled ? null : roleAt({ x: event.clientX, y: event.clientY });
        setHold(null);
        if (target) assign(target, source.ref);
        else announce("Dropped outside a role. Nothing changed.");
      };
      const up = (event: PointerEvent) => finish(event, false);
      const cancel = (event: PointerEvent) => finish(event, true);
      window.addEventListener("pointermove", move, { passive: false });
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", cancel);
    },
    [assign, announce],
  );

  // ---- keyboard pick up ---------------------------------------------------------------------------------------
  const pickUp = useCallback(
    (source: SwatchSource) => {
      setHold({ source, mode: "keyboard", x: 0, y: 0, over: null });
      announce(`Picked up ${refLabel(source.ref)}. Use the arrow keys to choose a role, Space to drop, Escape to cancel.`);
    },
    [announce],
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
    else announce("Not over a role. Nothing changed.");
  }, [assign, announce]);
  const cancel = useCallback(() => {
    if (!live.current.hold) return;
    setHold(null);
    announce("Cancelled. Nothing changed.");
  }, [announce]);

  const value = useMemo<Dnd>(
    () => ({ hold, rejections, assign, dismiss, reset, announce, startPointer, pickUp, move, drop, cancel }),
    [hold, rejections, assign, dismiss, reset, announce, startPointer, pickUp, move, drop, cancel],
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
 * A swatch you can pick up. Pointer drag starts after a few pixels of movement (a plain click still works, for
 * example to copy a hex); Space picks it up for the keyboard flow. Without the provider it is a plain button.
 */
export function DragSwatch({ source, onKeyDown, onKeyUp, onPointerDown, children, ...rest }: { source: SwatchSource } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const dnd = useRolesDnd();
  const holding = dnd?.hold?.source.id === source.id && dnd.hold.mode === "keyboard";
  return (
    <button
      type="button"
      {...rest}
      data-swatch={source.id}
      data-holding={holding ? "true" : undefined}
      aria-roledescription={dnd ? "draggable swatch" : undefined}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (dnd && event.button === 0) dnd.startPointer(source, event.nativeEvent);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!dnd || event.defaultPrevented) return;
        if (event.key === " ") {
          event.preventDefault();
          if (!dnd.hold) dnd.pickUp(source);
          else if (holding) dnd.drop();
        } else if (holding && (event.key === "ArrowDown" || event.key === "ArrowRight")) {
          event.preventDefault();
          dnd.move(1);
        } else if (holding && (event.key === "ArrowUp" || event.key === "ArrowLeft")) {
          event.preventDefault();
          dnd.move(-1);
        } else if (holding && event.key === "Escape") {
          event.preventDefault();
          dnd.cancel();
        }
      }}
      onKeyUp={(event) => {
        onKeyUp?.(event);
        if (event.key === " " && dnd) event.preventDefault();
      }}
      onBlur={(event) => {
        rest.onBlur?.(event);
        if (holding) dnd?.cancel();
      }}
    >
      {children}
    </button>
  );
}
