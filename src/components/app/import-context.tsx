"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { PRESETS, parseSkillFile, useDesignSystem } from "@/lib/design-system";

export interface ImportStatus {
  ok: boolean;
  fileName: string;
  text: string;
}

interface ImportApi {
  status: ImportStatus | null;
  /** Opens the file picker (the one hidden input of the page). */
  choose: () => void;
  /** Reads a file (from the picker or a drop) and restores its settings, or says why not. */
  importFile: (file: File | undefined) => Promise<void>;
  dismiss: () => void;
}

const Context = createContext<ImportApi | null>(null);
export const useImport = () => useContext(Context)!;

const MARKDOWN_NAME = /\.(md|markdown|txt)$/i;

/**
 * Import is shared by the top bar (from any page) and the Export screen's Import card, so both show the same result.
 * One hidden file input lives here; it is cleared right after reading, so choosing the same file again still counts.
 */
export function ImportProvider({ children }: { children: ReactNode }) {
  const { importSettings } = useDesignSystem();
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ImportStatus | null>(null);

  const importFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      if (input.current) input.current.value = "";
      if (!MARKDOWN_NAME.test(file.name) && !file.type.startsWith("text/")) {
        setStatus({ ok: false, fileName: file.name, text: "This is not a Markdown file. Choose a .md file exported from Design Sys.md (SKILL.md or AGENTS.md)." });
        return;
      }
      let text: string;
      try {
        text = await file.text();
      } catch {
        setStatus({ ok: false, fileName: file.name, text: "The file could not be read. Try choosing it again." });
        return;
      }
      if (text.trim() === "") {
        setStatus({ ok: false, fileName: file.name, text: "The file is empty." });
        return;
      }
      const result = parseSkillFile(text);
      if (!result.ok) {
        setStatus({ ok: false, fileName: file.name, text: result.error });
        return;
      }
      importSettings({ presetId: result.presetId, settings: result.settings });
      const name = result.settings.project.name;
      const changes = `${result.changes} ${result.changes === 1 ? "change" : "changes"}`;
      setStatus({
        ok: true,
        fileName: file.name,
        text: `Restored ${PRESETS[result.presetId].name} with ${changes}.${name ? ` Product name ${name}.` : ""}${result.notices.length ? ` ${result.notices.join(" ")}` : ""}`,
      });
    },
    [importSettings],
  );

  const choose = useCallback(() => input.current?.click(), []);
  const dismiss = useCallback(() => setStatus(null), []);
  const value = useMemo(() => ({ status, choose, importFile, dismiss }), [status, choose, importFile, dismiss]);

  return (
    <Context.Provider value={value}>
      <input
        ref={input}
        type="file"
        aria-label="Import a previous file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => void importFile(event.target.files?.[0])}
      />
      {children}
    </Context.Provider>
  );
}
