"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, Ellipsis, Moon, Sun, Upload } from "lucide-react";
import { useImport } from "./import-context";
import { PRESETS, PRESET_IDS, useDesignSystem } from "@/lib/design-system";

/**
 * The "More" menu of the compact top bar (below 768px): the preset switch, Import file and the theme toggle.
 * A real menu: the button has aria-haspopup and aria-expanded, arrows/Home/End move between items, Escape closes and
 * returns focus to the button, Tab closes, and a click outside closes. Items are at least 44px high.
 */
export function MoreMenu({ dark, onToggleTheme }: { dark: boolean; onToggleTheme: () => void }) {
  const { presetId, applyPreset } = useDesignSystem();
  const { choose } = useImport();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();

  const items = () => Array.from(menu.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? []);
  const focusItem = (index: number) => {
    const list = items();
    list[(index + list.length) % list.length]?.focus();
  };
  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) button.current?.focus();
  };

  // When the menu opens, focus goes to its first item (or the checked preset).
  useEffect(() => {
    if (!open) return;
    const list = items();
    (list.find((item) => item.getAttribute("aria-checked") === "true") ?? list[0])?.focus();
  }, [open]);

  // A click or touch outside closes the menu without stealing focus from what was pressed.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menu.current?.contains(target) && !button.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onButtonKey = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
    }
  };
  const onMenuKey = (event: KeyboardEvent) => {
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLElement);
    if (event.key === "ArrowDown") focusItem(index + 1);
    else if (event.key === "ArrowUp") focusItem(index - 1);
    else if (event.key === "Home") focusItem(0);
    else if (event.key === "End") focusItem(list.length - 1);
    else if (event.key === "Escape") close();
    else if (event.key === "Tab") setOpen(false);
    else return;
    if (event.key !== "Tab") event.preventDefault();
  };

  const row = "flex min-h-11 w-full items-center gap-3 rounded-[10px] px-3 text-left text-base leading-6 hover:bg-card";

  return (
    <div className="relative">
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onButtonKey}
        className="tool-btn tool-btn--secondary inline-flex h-11 items-center gap-2 px-3 text-base font-medium leading-6"
      >
        <Ellipsis aria-hidden className="size-4" />
        More
      </button>
      {open ? (
        <div ref={menu} id={id} role="menu" aria-label="More" onKeyDown={onMenuKey} className="tool-panel absolute right-0 top-full z-50 mt-2 flex w-64 flex-col gap-1 p-2 shadow-[var(--t-shadow-md)]">
          <div role="group" aria-label="Preset" className="flex flex-col gap-1">
            <span className="px-3 pt-1 text-xs leading-4 text-muted-foreground">Preset</span>
            {PRESET_IDS.map((preset) => (
              <button
                key={preset}
                type="button"
                role="menuitemradio"
                aria-checked={preset === presetId}
                tabIndex={-1}
                onClick={() => {
                  applyPreset(preset);
                  close();
                }}
                className={row}
              >
                <span className="min-w-0 flex-1">{PRESETS[preset].name}</span>
                {preset === presetId ? <Check aria-hidden className="size-4 shrink-0" /> : null}
              </button>
            ))}
          </div>
          <div role="separator" className="my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            onClick={() => {
              setOpen(false);
              choose();
            }}
            className={row}
          >
            <Upload aria-hidden className="size-4 shrink-0" />
            Import file
          </button>
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            onClick={() => {
              onToggleTheme();
              close();
            }}
            className={row}
          >
            {dark ? <Sun aria-hidden className="size-4 shrink-0" /> : <Moon aria-hidden className="size-4 shrink-0" />}
            {dark ? "Switch to light mode" : "Switch to dark mode"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
