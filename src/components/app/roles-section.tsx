"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, GripVertical } from "lucide-react";
import {
  PILL_MEANING,
  ROLE_ROWS,
  describeRole,
  hasOverride,
  overrideCount,
  refLabel,
  rolePill,
  sentenceCase,
  swatchGroups,
  useDesignSystem,
  type OverridableRole,
  type SwatchGroup,
  type SwatchSource,
} from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { DragSwatch, useRolesDnd } from "./roles-dnd";

const TRAY_HINT = "Drag onto a role, or click then click a role";

/**
 * The tray: every swatch a role can take, in a bar that sticks to the top of the editor panel while the roles list scrolls.
 * Brand, neutral and (if added) secondary scales each get one row of ten; the status colors, white and black share the
 * last row. A tray swatch is dragged or picked up with a click; it never copies. While one is held a bar says so.
 */
export function SwatchTray() {
  const { tokens } = useDesignSystem();
  const dnd = useRolesDnd()!;
  const groups = swatchGroups(tokens);
  const rows: { id: string; title: string; items: SwatchSource[] }[] = [
    { id: "brand", title: "Brand", items: groups.find((g) => g.id === "brand")!.items },
    { id: "neutral", title: "Neutral", items: groups.find((g) => g.id === "neutral")!.items },
    ...(groups.find((g) => g.id === "secondary") ? [{ id: "secondary", title: "Second.", items: groups.find((g) => g.id === "secondary")!.items }] : []),
    { id: "other", title: "Other", items: [...groups.find((g) => g.id === "status")!.items, ...groups.find((g) => g.id === "fixed")!.items] },
  ];
  const tray = useRef<HTMLDivElement>(null);
  // The panel needs the tray height, so a row scrolled into view is not hidden under it.
  useEffect(() => {
    const element = tray.current;
    const scroller = element?.closest<HTMLElement>("[data-role-scroll]");
    if (!element || !scroller) return;
    const set = () => scroller.style.setProperty("--tray-h", `${element.offsetHeight + 8}px`);
    set();
    const observer = new ResizeObserver(set);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const hold = dnd.hold;
  const bar = !hold
    ? TRAY_HINT
    : hold.mode === "pointer"
      ? `Dragging ${refLabel(hold.source.ref)}. Release over a role. Esc to cancel.`
      : hold.mode === "keyboard"
        ? `Holding ${refLabel(hold.source.ref)}. Arrow keys choose a role, Space drops. Esc to cancel.`
        : `Holding ${refLabel(hold.source.ref)}. Click a role to use it. Esc to cancel.`;

  return (
    <div ref={tray} data-tray className="sticky top-0 z-20 -mx-1 space-y-1 border-b border-border bg-background px-1 pb-2 pt-1 max-md:top-[var(--topbar-h,60px)]">
      <p data-tray-bar className={cn("flex h-9 items-center rounded-[10px] px-2 text-xs font-medium leading-4", hold ? "bg-foreground text-background" : "text-muted-foreground")}>
        {bar}
      </p>
      {rows.map((row) => (
        <div key={row.id} role="group" aria-label={`${row.title === "Second." ? "Secondary" : row.title} swatches`} className="flex items-center gap-1">
          <span aria-hidden className="w-14 shrink-0 text-xs leading-4 text-muted-foreground">
            {row.title}
          </span>
          <div className="grid flex-1 grid-cols-10 gap-0.5">
            {row.items.map((source) => (
              <DragSwatch
                key={source.id}
                source={source}
                className="tool-swatch"
                style={{ background: source.hex, height: 22 }}
                aria-label={`${sentenceCase(source.label)}, ${source.hex}`}
                title={`${sentenceCase(source.label)}, ${source.hex}. ${TRAY_HINT}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** A color picker for one role: a grid of every swatch with arrow key navigation. Enter picks, Escape closes. */
function RolePicker({ role, groups, currentHex, onPick, onClose }: { role: OverridableRole; groups: SwatchGroup[]; currentHex: string; onPick: (source: SwatchSource) => void; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const label = ROLE_ROWS.find((row) => row.key === role)!.label;
  const initial = (() => {
    for (let g = 0; g < groups.length; g++) {
      const i = groups[g].items.findIndex((item) => item.hex.toUpperCase() === currentHex.toUpperCase());
      if (i >= 0) return { g, i };
    }
    return { g: 0, i: 0 };
  })();
  const [cursor, setCursor] = useState(initial);

  const focusAt = (g: number, i: number) => {
    setCursor({ g, i });
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(`[data-pick="${g}-${i}"]`)?.focus());
  };
  useEffect(() => {
    root.current?.querySelector<HTMLElement>(`[data-pick="${initial.g}-${initial.i}"]`)?.focus();
    // Only on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKeyDown = (event: KeyboardEvent) => {
    const { g, i } = cursor;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      if (i < groups[g].items.length - 1) focusAt(g, i + 1);
      else if (g < groups.length - 1) focusAt(g + 1, 0);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (i > 0) focusAt(g, i - 1);
      else if (g > 0) focusAt(g - 1, groups[g - 1].items.length - 1);
    } else if (event.key === "ArrowDown" && g < groups.length - 1) {
      event.preventDefault();
      focusAt(g + 1, Math.min(i, groups[g + 1].items.length - 1));
    } else if (event.key === "ArrowUp" && g > 0) {
      event.preventDefault();
      focusAt(g - 1, Math.min(i, groups[g - 1].items.length - 1));
    }
  };

  return (
    <div ref={root} role="dialog" aria-label={`Choose a color for ${label}`} onKeyDown={onKeyDown} className="mt-2 space-y-2 rounded-[10px] border border-border bg-background p-2">
      <p className="text-xs leading-4 text-muted-foreground">Arrow keys move, Enter chooses, Escape closes.</p>
      {groups.map((group, g) => (
        <div key={group.id} className="space-y-1">
          <div className="text-xs leading-4 text-muted-foreground">{group.title}</div>
          <div className="flex flex-wrap gap-1">
            {group.items.map((source, i) => (
              <button
                key={source.id}
                type="button"
                data-pick={`${g}-${i}`}
                tabIndex={cursor.g === g && cursor.i === i ? 0 : -1}
                aria-label={`${sentenceCase(source.label)}, ${source.hex}`}
                aria-pressed={source.hex.toUpperCase() === currentHex.toUpperCase()}
                onClick={() => onPick(source)}
                className="tool-swatch !w-[27px]"
                style={{ background: source.hex, height: 24 }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RoleRow({ role, open, onToggle, onClose }: { role: OverridableRole; open: boolean; onToggle: () => void; onClose: () => void }) {
  const { tokens, settings } = useDesignSystem();
  const dnd = useRolesDnd()!;
  const row = ROLE_ROWS.find((r) => r.key === role)!;
  const button = useRef<HTMLButtonElement>(null);
  const hex = tokens.colors.roles[role];
  const custom = hasOverride(settings, role);
  const pill = rolePill(tokens, role);
  const over = dnd.hold?.over === role;
  const rejection = dnd.rejections[role];

  const closePicker = () => {
    onClose();
    button.current?.focus();
  };

  return (
    <li
      data-role-row={role}
      data-over={over ? "true" : undefined}
      onClick={(event) => {
        // Click to pick up, then click a role: place the held swatch (same safety check as a drop).
        if (dnd.hold && dnd.hold.mode !== "pointer" && !(event.target as HTMLElement).closest("button, [role=dialog]")) dnd.place(role);
      }}
      className={cn("rounded-[10px] border bg-background p-2", over ? "tool-row-over border-transparent" : "border-border")}
      style={{ scrollMarginTop: "var(--tray-h, 150px)" }}
    >
      <div className="flex items-center gap-3">
        <GripVertical aria-hidden className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        <span aria-hidden className="tool-sample size-6 shrink-0 rounded-[5px]" style={{ background: hex }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-medium leading-5">
            <span className="truncate">{row.label}</span>
            {custom ? <span className="rounded-full bg-muted px-1.5 text-xs font-medium leading-4 text-muted-foreground">Custom</span> : null}
          </div>
          <div className="truncate text-xs leading-4 text-muted-foreground">{over && dnd.hold ? `Drop to use ${refLabel(dnd.hold.source.ref)}` : describeRole(tokens, role)}</div>
        </div>
        <span
          title={PILL_MEANING[role]}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium leading-4",
            pill.passes === null ? "bg-muted text-muted-foreground" : pill.passes ? "bg-[var(--t-success-50)] text-[var(--t-success-700)]" : "bg-[var(--t-warning-50)] text-[var(--t-warning-700)]",
          )}
        >
          {pill.text}
        </span>
      </div>

      <div className="mt-1 flex items-center justify-end gap-3">
        {custom ? (
          <button type="button" aria-label={`Reset ${row.label}`} onClick={() => dnd.reset(role)} className="tool-link h-6 rounded-[5px] px-1 text-sm leading-5">
            Reset
          </button>
        ) : null}
        <button
          ref={button}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`Change ${row.label}`}
          onClick={onToggle}
          className="tool-link inline-flex h-6 items-center gap-0.5 rounded-[5px] px-1 text-sm leading-5"
        >
          Change
          <ChevronDown aria-hidden className={cn("size-3.5", open && "rotate-180")} strokeWidth={1.5} />
        </button>
      </div>

      {open ? (
        <RolePicker
          role={role}
          groups={swatchGroups(tokens)}
          currentHex={hex}
          onClose={closePicker}
          onPick={(source) => {
            dnd.assign(role, source.ref);
            closePicker();
          }}
        />
      ) : null}

      {dnd.removed && !settings.colors.secondary && row.key in dnd.removed.overrides ? (
        <div id={`role-removed-${role}`} className="mt-2 flex items-center justify-between gap-2 rounded-[10px] bg-muted p-2 text-xs leading-4 text-muted-foreground">
          <p>Secondary color was removed, so {row.label} went back to automatic.</p>
          <button type="button" onClick={() => dnd.undoSecondaryRemoved()} className="tool-link h-6 shrink-0 rounded-[5px] px-1 text-sm leading-5">
            Undo
          </button>
        </div>
      ) : null}

      {rejection ? (
        <div id={`role-msg-${role}`} className="mt-2 rounded-[10px] bg-[var(--t-warning-50)] p-2 text-xs leading-4 text-[var(--t-warning-700)]">
          <p>{rejection.message}</p>
          <div className="mt-2 flex items-center gap-2">
            {rejection.suggestion ? (
              <button type="button" onClick={() => dnd.assign(role, rejection.suggestion!)} className="tool-btn tool-btn--secondary h-8 px-3 text-sm font-medium leading-5">
                Use {refLabel(rejection.suggestion)}
              </button>
            ) : null}
            <button type="button" onClick={() => dnd.dismiss(role)} className="tool-link h-8 rounded-[10px] px-3 text-sm leading-5">
              Keep current
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

/** The Roles section: which swatch plays which role. Drag a swatch onto a row, or use Change. */
export function RolesSection() {
  const { settings } = useDesignSystem();
  const dnd = useRolesDnd()!;
  const [open, setOpen] = useState<OverridableRole | null>(null);
  const count = overrideCount(settings);

  return (
    <section aria-labelledby="roles-title" className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 id="roles-title" className="text-sm font-medium leading-5">
          Roles
        </h3>
        {count > 0 ? (
          <button type="button" onClick={() => dnd.reset()} className="tool-link text-xs leading-4">
            Reset all roles
          </button>
        ) : (
          <span className="text-xs leading-4 text-muted-foreground">Drag a swatch onto a role</span>
        )}
      </div>
      <p className="text-xs leading-4 text-muted-foreground">Roles you do not change stay automatic and follow your brand color. Change opens a picker; Space picks up a swatch for the keyboard.</p>
      <SwatchTray />
      <ul data-holding={dnd.hold && dnd.hold.mode !== "pointer" ? "true" : undefined} className="space-y-2">
        {ROLE_ROWS.map((row) => (
          <RoleRow key={row.key} role={row.key} open={open === row.key} onToggle={() => setOpen(open === row.key ? null : row.key)} onClose={() => setOpen(null)} />
        ))}
      </ul>
    </section>
  );
}
