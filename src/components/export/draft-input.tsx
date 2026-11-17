"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";

/** The same cleaning the design system applies to a one line text (see oneLine in normalize.ts). */
const cleaned = (text: string) => text.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim();

/**
 * A text field that shows exactly what is typed while it has focus (spaces, a trailing space, several words).
 * The saved value is cleaned by the design system (trimmed, spaces collapsed) on every change, which is also what the
 * export uses; the field shows that cleaned value again when focus leaves.
 */
export function DraftInput({
  value,
  onValue,
  ...rest
}: { value: string; onValue: (value: string) => void } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
>) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  // A change that comes from elsewhere (a reset, an import) shows right away. The saved value that only differs from the
  // draft by cleaning (spaces trimmed or collapsed) is the person's own typing, so the draft stays as typed.
  useEffect(() => {
    setDraft((current) => (!focused.current || cleaned(current) !== value ? value : current));
  }, [value]);
  return (
    <input
      {...rest}
      type="text"
      value={draft}
      onFocus={() => {
        focused.current = true;
      }}
      onChange={(event) => {
        setDraft(event.target.value);
        onValue(event.target.value);
      }}
      onBlur={() => {
        focused.current = false;
        setDraft(value);
      }}
    />
  );
}
