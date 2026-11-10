import type { ReactNode } from "react";

/**
 * A small markdown renderer for the exact subset the skill file uses: frontmatter, headings,
 * paragraphs, lists, checklists, tables, fenced code and inline code and bold. It builds React
 * elements and never injects raw HTML.
 */

function inline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
      return (
        <code key={`${keyPrefix}${i}`} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={`${keyPrefix}${i}`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());

export function MarkdownView({ source }: { source: string }) {
  const lines = source.split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;

  if (lines[0]?.trim() === "---") {
    const end = lines.indexOf("---", 1);
    if (end > 0) {
      out.push(
        <div key={key++} className="rounded-lg border border-border bg-muted/50 p-3">
          <div className="mb-1 text-xs font-medium text-muted-foreground">Frontmatter</div>
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs">{lines.slice(1, end).join("\n")}</pre>
        </div>,
      );
      i = end + 1;
    }
  }

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) body.push(lines[i++]);
      i++;
      out.push(
        <pre key={key++} className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 font-mono text-xs leading-relaxed">
          {body.join("\n")}
        </pre>,
      );
      continue;
    }

    const heading = line.match(/^(#{1,3}) (.*)$/);
    if (heading) {
      const level = heading[1].length;
      const cls = level === 1 ? "text-2xl font-semibold tracking-tight" : level === 2 ? "pt-4 text-xl font-semibold tracking-tight" : "pt-2 text-base font-semibold";
      out.push(
        <div key={key++} role="heading" aria-level={level} className={cls}>
          {inline(heading[2], `h${key}`)}
        </div>,
      );
      i++;
      continue;
    }

    if (line.trim().startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(splitRow(lines[i++]));
      const [head, , ...body] = rows;
      out.push(
        <div key={key++} className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                {head.map((cell, c) => (
                  <th key={c} scope="col" className="px-3 py-2 font-medium">
                    {inline(cell, `th${key}${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, r) => (
                <tr key={r} className="border-t border-border align-top">
                  {row.map((cell, c) => (
                    <td key={c} className="px-3 py-2">
                      {inline(cell, `td${key}${r}${c}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (/^(- |\d+\. )/.test(line)) {
      const ordered = /^\d+\. /.test(line);
      const items: string[] = [];
      while (i < lines.length && /^(- |\d+\. )/.test(lines[i])) items.push(lines[i++].replace(/^(- |\d+\. )/, ""));
      const List = ordered ? "ol" : "ul";
      out.push(
        <List key={key++} className={`space-y-1 pl-5 text-sm ${ordered ? "list-decimal" : "list-disc"}`}>
          {items.map((item, n) => (
            <li key={n}>{inline(item.replace(/^\[ \] /, "☐ "), `li${key}${n}`)}</li>
          ))}
        </List>,
      );
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,3} |```|\||- |\d+\. )/.test(lines[i])) para.push(lines[i++]);
    out.push(
      <p key={key++} className="text-sm leading-relaxed">
        {inline(para.join(" "), `p${key}`)}
      </p>,
    );
  }

  return <div className="space-y-3">{out}</div>;
}
