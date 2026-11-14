import { fence, lines, spaceVar, unit, type SkillContext, tight } from "./context";

/** Tailwind's container sizes by px, for max-w classes. */
const CONTAINER: Record<number, string> = { 384: "sm", 448: "md", 512: "lg", 576: "xl", 672: "2xl", 768: "3xl", 896: "4xl", 1024: "5xl", 1152: "6xl", 1280: "7xl" };
export const maxWidthClass = (px: number) => `max-w-${CONTAINER[px] ?? "7xl"}`;

export function layoutSection(ctx: SkillContext): string[] {
  const { layout, controls, spacing, colors } = ctx.t;
  const tw = ctx.tailwind;
  const pad = layout.pagePadding;
  const padClasses = `px-${unit(pad.base)} md:px-${unit(pad.md)} lg:px-${unit(pad.lg)}`;
  const itemClasses = `flex h-${unit(controls.buttons.height.md)} items-center gap-${unit(spacing.semantic.inlineGap)} rounded-md px-${unit(spacing.semantic.inputPaddingX)} text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-sidebar-accent-foreground focus-ring`;
  const bp = layout.breakpoints;

  const code = tw
    ? ctx.shadcn
      ? [
          "<SidebarProvider>",
          "  <AppSidebar />  {/* shadcn Sidebar. Collapses to a sheet below md */}",
          "  <SidebarInset>",
          `    <header className="flex h-${unit(layout.headerHeight)} items-center gap-${unit(spacing.semantic.inlineGap)} border-b border-border ${padClasses}"><SidebarTrigger aria-label="Toggle sidebar" /></header>`,
          `    <main className="mx-auto flex w-full ${maxWidthClass(layout.maxContentWidth)} flex-col gap-${unit(spacing.semantic.sectionGap)} py-${unit(spacing.semantic.cardPadding)} ${padClasses}">…</main>`,
          "  </SidebarInset>",
          "</SidebarProvider>",
          `// Sidebar menu item (SidebarMenuButton): "${itemClasses}"`,
        ]
      : [
          `<div className="flex min-h-screen">`,
          `  <aside className="hidden w-${unit(layout.sidebar.width)} shrink-0 flex-col gap-${unit(spacing.semantic.inlineGap / 2)} border-r border-sidebar-border bg-sidebar p-${unit(spacing.semantic.inlineGap)} md:flex">`,
          `    <a href="/" aria-current="page" className="${itemClasses}">Item</a>`,
          "  </aside>",
          `  <div className="flex min-w-0 flex-1 flex-col">`,
          `    <header className="flex h-${unit(layout.headerHeight)} items-center border-b border-border ${padClasses}">…</header>`,
          `    <main className="mx-auto flex w-full ${maxWidthClass(layout.maxContentWidth)} flex-col gap-${unit(spacing.semantic.sectionGap)} py-${unit(spacing.semantic.cardPadding)} ${padClasses}">…</main>`,
          "  </div>",
          "</div>",
        ]
    : [
        `:root { --page-pad: ${spaceVar(ctx, pad.base)}; } @media (min-width: ${bp.md}px) { :root { --page-pad: ${spaceVar(ctx, pad.md)}; } } @media (min-width: ${bp.lg}px) { :root { --page-pad: ${spaceVar(ctx, pad.lg)}; } }`,
        `.shell { display: flex; min-height: 100vh; } .shell__main { flex: 1; min-width: 0; } .sidebar { width: var(--sidebar-w); flex-shrink: 0; padding: var(--gap-inline); border-right: var(--border-w) solid ${ctx.cssVar(colors.roles["sidebar-border"], "border", ["sidebar-border", "border"])}; background: ${ctx.cssVar(colors.roles.sidebar, "fill", ["sidebar"])}; } @media (max-width: ${bp.md - 1}px) { .sidebar { display: none; } }`,
        `.nav-item { display: flex; height: var(--control-h); align-items: center; gap: var(--gap-inline); padding: 0 var(--input-px); border-radius: var(--radius-md); color: ${ctx.cssVar(colors.roles["sidebar-foreground"], "text", ["sidebar-foreground"])}; } .nav-item:hover, .nav-item[aria-current="page"] { background: ${ctx.cssVar(colors.roles["sidebar-accent"], "fill", ["sidebar-accent"])}; color: ${ctx.cssVar(colors.roles["sidebar-accent-foreground"], "text", ["sidebar-accent-foreground"])}; }`,
        `.header { display: flex; height: var(--header-h); align-items: center; justify-content: space-between; padding-inline: var(--page-pad); border-bottom: var(--border-w) solid ${ctx.cssVar(colors.roles.border, "border", ["border"])}; }`,
        `.page { display: grid; max-width: var(--content-max); gap: var(--gap-section); margin: 0 auto; padding: var(--pad-card) var(--page-pad); }`,
      ];

  return lines(
    "## Layout and navigation",
    "",
    tw
      ? `Shell: sidebar (${layout.sidebar.width}px, ${layout.sidebar.collapsed}px collapsed to icons), a ${layout.headerHeight}px top bar, then centered content at most ${layout.maxContentWidth}px wide. Page padding ${pad.base}px on phones, ${pad.md}px from md, ${pad.lg}px from lg; sections ${spacing.semantic.sectionGap}px apart. Breakpoints: sm ${bp.sm}px (two columns), md ${bp.md}px (sidebar appears), lg ${bp.lg}px (three or four columns), xl ${bp.xl}px. ${ctx.shadcn ? "" : "Below md the sidebar is a menu opened from an icon button in the top bar."}`
      : `Shell: sidebar (\`--sidebar-w\`, ${layout.sidebar.collapsed}px collapsed to icons), a \`--header-h\` top bar, then centered content at most \`--content-max\` wide, padded by \`--page-pad\`, sections \`--gap-section\` apart. Breakpoints: sm ${bp.sm}px (two columns), md ${bp.md}px (sidebar appears), lg ${bp.lg}px (three or four columns), xl ${bp.xl}px. Below md the sidebar is a menu opened from an icon button in the top bar.`,
    "",
    `**Public and marketing pages** (pricing, landing, sign in): no sidebar. A simple ${layout.headerHeight}px top bar with the logo and at most one action: secondary or tertiary when the page body has a primary button, primary only when it has none, and never \`cta\`. The bar is a flex row with \`${tw ? "justify-between" : "justify-content: space-between"}\`: logo left, action right. Then centered content at most ${layout.maxContentWidth}px wide with the same page padding.`,
    "",
    `Sidebar roles: \`sidebar\` the panel, \`sidebar-accent\` the hovered or current item, \`sidebar-primary\` an accent mark (logo, active icon), \`sidebar-border\` its edge. One current item (\`aria-current="page"\`), muted ${tw ? "`text-xs`" : "`--text-xs`"} group labels, one level only.`,
    "",
    fence(tw ? "tsx" : "css", tight(ctx, compact(code))),
    tw ? null : "",
    tw ? null : fence("html", ['<header class="header"><a href="/">Logo</a><a class="btn btn--secondary" href="/sign-in">Sign in</a></header>']),
    "",
  );
}

const compact = (code: string[]) => code;
