/**
 * Layout for the preview samples only (grids, labels). It uses the same design tokens as the skill file's
 * CSS, through the variables that file defines, so it follows the user's choices.
 */
export const EXTRA_CSS = `
.pvx-page { padding: var(--pad-card); display: grid; gap: var(--gap-section); }
.pvx-head h1, .pvx-head h2 { margin: 0; font: 600 var(--text-3xl) / var(--leading-3xl) var(--font-heading); letter-spacing: var(--tracking-heading); }
.pvx-head p, .pvx-note { margin: 0; font-size: var(--text-sm); line-height: var(--leading-sm); color: var(--muted-foreground); }
.pvx-section { display: grid; gap: var(--gap-stack); }
.pvx-section > h2 { margin: 0; font: 600 var(--text-lg) / var(--leading-lg) var(--font-heading); letter-spacing: var(--tracking-heading-xs); }
.pvx-matrix { display: grid; grid-template-columns: 120px repeat(5, 1fr); gap: var(--gap-stack) var(--gap-inline); align-items: center; }
.pvx-label { font-size: var(--text-xs); line-height: var(--leading-xs); color: var(--muted-foreground); }
.pvx-row { display: flex; flex-wrap: wrap; gap: var(--gap-stack); align-items: center; }
.pvx-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--gap-stack); align-items: start; }
.pvx-box { display: grid; gap: var(--gap-stack); padding: var(--pad-card); border: var(--border-w) solid var(--border); border-radius: var(--radius-lg); }
.pvx-choice { display: flex; align-items: center; gap: var(--gap-inline); font-size: var(--text-base); }
.pvx-ring { width: 16px; height: 16px; border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%; }
.pvx-icon { width: var(--control-h); padding: 0; }
.pvx-split { display: flex; align-items: center; justify-content: space-between; gap: var(--gap-stack); }
.pvx-actions { display: flex; justify-content: flex-end; gap: var(--gap-inline); }
.pvx-card-head { display: grid; gap: var(--space-1); margin-bottom: var(--gap-stack); }
.pvx-card-head h2 { margin: 0; font: 600 var(--text-xl) / var(--leading-xl) var(--font-heading); letter-spacing: var(--tracking-heading-sm); }
.pvx-fieldset { border: 0; padding: 0; margin: 0; display: grid; gap: var(--gap-inline); }
.pvx-fieldset legend { padding: 0; font-size: var(--text-sm); font-weight: 500; margin-bottom: var(--space-1); }
.pvx-switch-row { display: flex; align-items: center; justify-content: space-between; gap: var(--gap-stack); }
.pvx-table-wrap { overflow: hidden; border-radius: var(--radius-md); border: var(--border-w) solid var(--border); }
.pvx-table-wrap .table { margin: 0; }
.pvx-table-wrap .table tbody tr:first-child td { border-top: 0; }
.pvx-person { display: grid; line-height: var(--leading-sm); }
.pvx-person small { font-size: var(--text-xs); line-height: var(--leading-xs); color: var(--muted-foreground); }
.pvx-select { appearance: auto; }
.pvx-form { max-width: 480px; }
.btn.pvx-icon { color: var(--muted-foreground); }
.btn.pvx-icon:hover, .btn.pvx-icon.is-hover { background: var(--accent); color: var(--accent-foreground); }
.btn.pvx-icon:active, .btn.pvx-icon.is-pressed { background: var(--neutral-200); color: var(--accent-foreground); }
`;
