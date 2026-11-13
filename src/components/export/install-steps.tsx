import type { ReactNode } from "react";
import type { StackId } from "@/lib/design-system";

const Code = ({ children }: { children: ReactNode }) => <code className="break-words rounded-[5px] bg-muted px-1 font-mono text-sm leading-5">{children}</code>;

const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="flex flex-col gap-3 rounded-[16px] border border-[var(--card-border)] bg-card p-6">
    <h3 className="text-base font-semibold leading-6">{title}</h3>
    {children}
  </div>
);

/** The three install cards. The folder name and the slash command come from the one generated name. */
export function InstallSteps({ slug, stack }: { slug: string; stack: StackId }) {
  return (
    <section aria-labelledby="install-title" className="flex flex-col gap-4">
      <div>
        <h2 id="install-title" className="text-xl font-semibold leading-7 tracking-[-0.005em]">
          How to install this file
        </h2>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">The tools read plain files. There is nothing to run.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Claude Code, SKILL.md">
          <ol className="list-decimal space-y-2 pl-6 text-sm leading-5">
            <li>
              In your project, create the folder <Code>.claude/skills/{slug}/</Code>. To use it in every project, use <Code>~/.claude/skills/{slug}/</Code> instead.
            </li>
            <li>
              Save the downloaded file inside it as <Code>SKILL.md</Code>.
            </li>
            <li>
              Start Claude Code. It reads the description, and loads the skill by itself whenever you ask for UI work. You can also type <Code>/{slug}</Code>.
            </li>
          </ol>
        </Card>
        <Card title="Codex, AGENTS.md">
          <ol className="list-decimal space-y-2 pl-6 text-sm leading-5">
            <li>
              Save the downloaded file as <Code>AGENTS.md</Code> in the root of your repository. For every project, use <Code>~/.codex/AGENTS.md</Code>.
            </li>
            <li>Codex reads it at the start of each session. It is plain Markdown, so there is no frontmatter.</li>
            <li>
              Codex reads at most 32 KiB of instructions by default. If you already have other AGENTS.md files, check the total, or raise <Code>project_doc_max_bytes</Code>.
            </li>
          </ol>
        </Card>
        <Card title="ChatGPT">
          <p className="text-sm leading-5">ChatGPT does not read SKILL.md or AGENTS.md on its own, so you give it the file.</p>
          <ol className="list-decimal space-y-2 pl-6 text-sm leading-5">
            <li>
              <span className="font-medium">Best:</span> create a ChatGPT Project and upload <Code>AGENTS.md</Code> to its files (or paste it into the Project instructions). Every chat in that Project can then use it. Start the first message with:
              &quot;Follow the design system file in this Project for all UI work, and run its Final checklist before you answer.&quot;
            </li>
            <li>
              <span className="font-medium">Quick:</span> paste the whole file at the start of a single chat, followed by your request.
            </li>
          </ol>
          <p className="text-sm leading-5">
            <span className="font-medium">If it is too long:</span> upload it as a file instead of pasting it. If that still fails, split it in two at a section heading: keep Hard rules, Tokens and the Final checklist together, and send the component sections you need for the task. Keep the
            data block at the end only in the copy you keep for yourself.
          </p>
          <p className="text-xs leading-4 text-muted-foreground">
            What ChatGPT accepts depends on your plan and changes over time. I could not verify the current limits, so no numbers are given here. Check OpenAI&apos;s help page &quot;Using Projects in ChatGPT&quot; before relying on a size.
          </p>
        </Card>
      </div>
      <p className="text-sm leading-5 text-muted-foreground">
        <span className="font-medium text-foreground">Then:</span>{" "}
        {stack === "html-css"
          ? "link the generated CSS in every page and remove the starter styles of your page, because they use their own colors."
          : "replace or restyle the starter home page your framework creates, because it uses its own colors."}
      </p>
    </section>
  );
}
