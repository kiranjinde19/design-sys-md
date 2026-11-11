"use client";

import { useState, type ReactNode } from "react";
import {
  FONT_CATALOG,
  FONT_CATEGORY_LABELS,
  WEIGHT_LABELS,
  catalogFont,
  effectiveFont,
  isDisplayFont,
  offeredWeights,
  sanitizeFontName,
  searchFonts,
  type FontCategory,
  type FontChoice,
  type FontWeight,
} from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { ChoiceButton } from "@/components/controls/controls";
import { nameFamily, useFontNames } from "./google-fonts";

type CategoryFilter = FontCategory | "all";
const FILTERS: CategoryFilter[] = ["all", "sans", "serif", "mono"];
const filterLabel = (filter: CategoryFilter) => (filter === "all" ? "All" : FONT_CATEGORY_LABELS[filter]);

interface FontPickerProps {
  title: string;
  choice: FontChoice;
  onChange: (choice: FontChoice) => void;
  /** Which category chip starts selected. */
  initialCategory: CategoryFilter;
  /** Heading and body pick a weight. Mono does not. */
  weight?: number;
  onWeightChange?: (weight: FontWeight) => void;
  /** For a body font picker: label headline-only (display) fonts in the list, so the risk is visible before picking. */
  markDisplay?: boolean;
  /** Extra controls shown at the bottom, such as the tracking slider. */
  children?: ReactNode;
}

/** Fields for the user's own licensed font. The preview uses the chosen fallback. */
function BrandFontForm({ choice, onChange }: { choice: FontChoice; onChange: (choice: FontChoice) => void }) {
  const [name, setName] = useState(choice.kind === "brand" ? choice.name : "");
  const [fallback, setFallback] = useState(choice.kind === "brand" ? choice.fallback : effectiveFont(choice).name);

  const commit = (nextName: string, nextFallback: string) => {
    const clean = sanitizeFontName(nextName);
    if (clean) onChange({ kind: "brand", name: clean, fallback: nextFallback });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-3">
      <label className="block space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Your font name</span>
        <input
          type="text"
          value={name}
          maxLength={60}
          placeholder="e.g. Acme Sans"
          className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
          onChange={(event) => {
            setName(event.target.value);
            commit(event.target.value, fallback);
          }}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Fallback font from the list</span>
        <select
          value={fallback}
          className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
          onChange={(event) => {
            setFallback(event.target.value);
            commit(name, event.target.value);
          }}
        >
          {(["sans", "serif", "mono"] as const).map((category) => (
            <optgroup key={category} label={FONT_CATEGORY_LABELS[category]}>
              {FONT_CATALOG.filter((font) => font.category === category).map((font) => (
                <option key={font.name} value={font.name}>
                  {font.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Licensed brand font.</span> You must hold the license and host the files yourself.
        This tool previews with the fallback, and the skill file records your font plus the fallback.
      </p>
    </div>
  );
}

export function FontPicker({
  title,
  choice,
  onChange,
  initialCategory,
  weight,
  onWeightChange,
  markDisplay,
  children,
}: FontPickerProps) {
  useFontNames();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CategoryFilter>(initialCategory);
  const [brandMode, setBrandMode] = useState(choice.kind === "brand");

  const visible = searchFonts(query, filter);
  const weights = offeredWeights(choice);
  const current = effectiveFont(choice);

  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="truncate text-xs text-muted-foreground">
          {choice.kind === "brand" ? `${choice.name} (brand font)` : choice.name}
        </span>
      </div>

      {brandMode ? (
        <BrandFontForm choice={choice} onChange={onChange} />
      ) : (
        <>
          <input
            type="search"
            value={query}
            placeholder="Search fonts or tags"
            aria-label={`Search ${title.toLowerCase()} fonts`}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Category">
            {FILTERS.map((option) => (
              <ChoiceButton key={option} selected={option === filter} onClick={() => setFilter(option)}>
                {filterLabel(option)}
              </ChoiceButton>
            ))}
          </div>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {visible.length} of {FONT_CATALOG.filter((font) => filter === "all" || font.category === filter).length} fonts
          </p>
          <ul className="max-h-56 overflow-y-auto rounded-lg border border-border" role="listbox" aria-label={`${title} fonts`}>
            {visible.length === 0 ? (
              <li className="p-3 text-sm text-muted-foreground">No fonts match.</li>
            ) : (
              visible.map((font) => {
                const selected = choice.kind === "catalog" && choice.name === font.name;
                return (
                  <li key={font.name}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => onChange(catalogFont(font.name))}
                      className={cn(
                        "flex w-full flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-3 py-2 text-left hover:bg-muted",
                        selected && "bg-muted",
                      )}
                    >
                      {/* The name comes first and is never cut off. If there is no room, the tag wraps below it. */}
                      <span className="break-words text-lg" style={{ fontFamily: nameFamily(font.name) }}>
                        {font.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {FONT_CATEGORY_LABELS[font.category]} ·{" "}
                        {markDisplay && isDisplayFont(font) ? "headline style, not for body text" : font.tags[0]}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </>
      )}

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={brandMode}
          onChange={(event) => {
            setBrandMode(event.target.checked);
            // Leaving brand mode returns to the fallback font, so the choice is always valid.
            if (!event.target.checked && choice.kind === "brand") onChange(catalogFont(choice.fallback));
          }}
        />
        Use my own font
      </label>

      {onWeightChange && weight !== undefined ? (
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground">
            Weight: {WEIGHT_LABELS[weight]} {weight}
            {choice.kind === "brand" ? ` (weights of ${current.name})` : ""}
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={`${title} weight`}>
            {weights.map((option) => (
              <ChoiceButton key={option} selected={option === weight} title={WEIGHT_LABELS[option]} onClick={() => onWeightChange(option)}>
                {option}
              </ChoiceButton>
            ))}
          </div>
        </div>
      ) : null}

      {children}
    </div>
  );
}
