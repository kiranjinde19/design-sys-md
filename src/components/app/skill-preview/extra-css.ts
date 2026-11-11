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
.pvx-matrix-wrap { overflow-x: auto; padding: 6px; margin: -6px; }
.pvx-matrix { display: grid; grid-template-columns: 88px repeat(5, minmax(max-content, 1fr)); gap: var(--gap-stack) max(12px, var(--gap-inline)); align-items: center; width: max-content; min-width: 100%; }
.pvx-matrix > span:not(.pvx-label):not(.pvx-rowlabel) { display: flex; }
.pvx-matrix .btn { flex: 1; white-space: nowrap; }
.pvx-label { font-size: var(--text-xs); line-height: var(--leading-xs); color: var(--muted-foreground); }
.pvx-rowlabel { font-size: var(--text-sm); line-height: var(--leading-sm); font-weight: 500; }
.pvx-row { display: flex; flex-wrap: wrap; gap: var(--gap-stack); align-items: center; }
.pvx-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--gap-stack); align-items: start; }
.pvx-box { display: grid; gap: var(--gap-stack); padding: var(--pad-card); border: var(--border-w) solid var(--border); border-radius: var(--radius-lg); }
.pvx-choice { display: flex; align-items: center; gap: var(--gap-inline); font-size: var(--text-base); }
.pvx-spin { flex: none; animation: pvx-spin 0.9s linear infinite; }
@keyframes pvx-spin { to { transform: rotate(360deg); } }
/* The spinner always turns. Under reduced motion it is replaced by a static indicator (three dots). */
.pvx-spin-static { display: none; flex: none; }
@media (prefers-reduced-motion: reduce) { .pvx-spin { display: none; } .pvx-spin-static { display: inline-block; } }
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
.pvx-pricing__page { display: grid; gap: var(--gap-section); padding: var(--gap-section) var(--page-pad); }
.pvx-pricing__head { display: grid; justify-items: center; gap: var(--gap-inline); text-align: center; }
.pvx-pricing__head h1 { margin: 0; font: 600 var(--text-4xl) / var(--leading-4xl) var(--font-heading); letter-spacing: var(--tracking-heading); }
.pvx-pricing__head p { margin: 0; color: var(--muted-foreground); max-width: 520px; }
.pvx-logo { display: inline-flex; align-items: center; gap: var(--gap-inline); font-family: var(--font-heading); font-size: var(--text-lg); }
.pvx-pricing .plan { gap: var(--gap-stack); }
.pvx-pricing .plan h3 { margin: 0; font: 600 var(--text-xl) / var(--leading-xl) var(--font-heading); letter-spacing: var(--tracking-heading-xs); }
.pvx-pricing .plan p { margin: 0; }
.pvx-plan__title { display: flex; align-items: baseline; justify-content: space-between; gap: var(--gap-inline); }
.pvx-rec { font-size: var(--text-sm); font-weight: 500; color: var(--pvx-brand-text); }
.pvx-price { font: 600 var(--text-4xl) / var(--leading-4xl) var(--font-heading); letter-spacing: var(--tracking-heading); font-variant-numeric: tabular-nums; }
.pvx-price small { font: 400 var(--text-sm) / var(--leading-sm) var(--font-body); letter-spacing: 0; color: var(--muted-foreground); }
.pvx-features { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--gap-stack); font-size: var(--text-base); }
.pvx-features li { display: flex; align-items: center; gap: var(--gap-inline); }
.pvx-features svg { flex: none; color: var(--pvx-brand-text); }
.pvx-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.pvx-mono { font-family: var(--font-mono); }
.pvx-dash.shell { min-height: 0; }
.pvx-dash .page { grid-template-columns: minmax(0, 1fr); }
.pvx-stats > *, .pvx-charts > *, .pvx-grid2 > * { min-width: 0; }
.pvx-dash .sidebar { display: flex; flex-direction: column; gap: var(--gap-stack); }
.pvx-brand { display: flex; align-items: center; gap: var(--gap-inline); height: var(--header-h); padding: 0 var(--input-px); margin: calc(var(--gap-inline) * -1) calc(var(--gap-inline) * -1) 0; font-family: var(--font-heading); }
.pvx-brand__tile { display: inline-flex; align-items: center; justify-content: center; width: var(--control-h); height: var(--control-h); border-radius: var(--radius-md); background: var(--sidebar-primary); color: var(--sidebar-primary-foreground); }
.pvx-navgroup { display: grid; gap: var(--space-1); }
.pvx-navlabel { margin: 0 0 var(--space-1); padding: 0 var(--input-px); font-size: var(--text-xs); line-height: var(--leading-xs); color: var(--muted-foreground); }
.pvx-dash a.nav-item { text-decoration: none; font-size: var(--text-sm); font-weight: 500; }
.pvx-header { justify-content: space-between; }
.pvx-avatar { border: 0; font: 500 var(--text-sm) / 1 var(--font-body); color: var(--foreground); }
.pvx-seg { display: inline-flex; padding: var(--space-0_5); border-radius: var(--radius-md); background: var(--muted); }
.pvx-seg button { height: var(--control-h-sm); padding: 0 var(--space-3); border: 0; border-radius: var(--radius-sm); background: none; color: var(--muted-foreground); font: 500 var(--text-sm) / 1 var(--font-body); }
.pvx-seg button[aria-pressed="true"] { background: var(--background); color: var(--foreground); box-shadow: var(--shadow-1); }
.pvx-dash .stats { grid-template-columns: repeat(4, 1fr); }
.pvx-statrow { display: flex; flex-wrap: wrap; align-items: center; gap: var(--gap-inline); margin-top: var(--gap-inline) !important; }
.pvx-statrow .badge { align-items: center; gap: var(--space-0_5); font-variant-numeric: tabular-nums; }
.pvx-charts { display: grid; grid-template-columns: 2fr 1fr; gap: var(--gap-stack); align-items: start; }
.pvx-grid2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--gap-stack); align-items: stretch; }
.pvx-chart { margin: 0; position: relative; min-width: 0; }
.pvx-chart svg, .pvx-donut svg { display: block; overflow: visible; }
.pvx-axis { font: 400 var(--text-xs) / 1 var(--font-body); fill: var(--muted-foreground); font-variant-numeric: tabular-nums; }
.pvx-value { font: 500 var(--text-xs) / 1 var(--font-body); fill: var(--foreground); font-variant-numeric: tabular-nums; }
.pvx-grid { stroke: var(--border); stroke-width: 1; }
.pvx-legend { display: flex; flex-wrap: wrap; gap: var(--gap-inline) var(--gap-stack); margin: 0 0 var(--gap-inline); padding: 0; list-style: none; font-size: var(--text-xs); line-height: var(--leading-xs); }
.pvx-legend li { display: flex; align-items: center; gap: var(--gap-inline); }
.pvx-legend__value { margin-left: auto; padding-left: var(--gap-inline); font-weight: 500; font-variant-numeric: tabular-nums; }
.pvx-donut { display: flex; align-items: center; gap: var(--gap-section); margin: 0; }
.pvx-donut .pvx-legend { flex-direction: column; flex: 1; gap: var(--gap-stack); margin: 0; font-size: var(--text-sm); line-height: var(--leading-sm); }
.pvx-donut .pvx-legend li { border-bottom: var(--border-w) solid var(--border); padding-bottom: var(--gap-inline); }
.pvx-tooltip-anchor { position: absolute; top: 0; width: 0; pointer-events: none; }
.pvx-tooltip { position: absolute; left: 0; top: 4px; transform: translateX(calc(-100% - var(--gap-inline))); display: grid; gap: var(--space-1); width: max-content; white-space: nowrap; padding: var(--gap-inline) var(--space-3); border: var(--border-w) solid var(--border); border-radius: var(--radius-md); background: var(--popover); color: var(--popover-foreground); box-shadow: var(--shadow-3); font-size: var(--text-xs); line-height: var(--leading-xs); }
.pvx-tooltip__row { display: flex; align-items: center; gap: var(--gap-inline); font-variant-numeric: tabular-nums; }
.pvx-colors { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--gap-stack); margin: 0 0 var(--gap-stack); padding: 0; list-style: none; }
.pvx-colors li { display: grid; gap: var(--space-1); align-content: start; font-size: var(--text-sm); }
.pvx-colors__swatch { height: var(--space-10); border-radius: var(--radius-md); }
.pvx-statcard { display: grid; gap: var(--gap-inline); align-content: start; }
.pvx-statcard p { margin: 0; }
.pvx-skel { display: flex; align-items: flex-end; gap: var(--gap-inline); height: 180px; }
.pvx-skel .skeleton { flex: 1; }
.pvx-form { max-width: 480px; }
.pvx-empty { display: grid; justify-items: center; gap: var(--gap-inline); text-align: center; color: var(--muted-foreground); }
.pvx-empty h2 { margin: 0; font: 600 var(--text-lg) / var(--leading-lg) var(--font-heading); color: var(--foreground); }
.pvx-error { display: flex; align-items: center; gap: var(--space-1); }
.pvx-error svg { flex: none; }
.pvx-layers { display: grid; grid-template-columns: 200px 1fr; gap: var(--gap-section); align-items: start; padding: var(--gap-stack) 0; }
.pvx-menu { display: grid; padding: var(--space-1); border: var(--border-w) solid var(--border); border-radius: var(--radius-md); background: var(--popover); color: var(--popover-foreground); box-shadow: var(--shadow-3); }
.pvx-menu__item { display: flex; align-items: center; gap: var(--gap-inline); height: var(--control-h-sm); padding: 0 var(--gap-inline); border: 0; border-radius: var(--radius-sm); background: none; color: inherit; font: inherit; font-size: var(--text-sm); text-align: left; }
.pvx-menu__item:hover, .pvx-menu__item.is-hover { background: var(--accent); color: var(--accent-foreground); }
.pvx-static { position: static; transform: none; width: auto; max-width: var(--dialog-w); }
.pvx-dialog-title { margin: 0; font: 600 var(--text-lg) / var(--leading-lg) var(--font-heading); }
.pvx-toasts { display: grid; gap: var(--gap-stack); grid-column: 2; }
.btn.pvx-icon { color: var(--muted-foreground); }
.btn.pvx-icon:hover, .btn.pvx-icon.is-hover { background: var(--accent); color: var(--accent-foreground); }
.btn.pvx-icon:active, .btn.pvx-icon.is-pressed { background: var(--neutral-200); color: var(--accent-foreground); }
`;
