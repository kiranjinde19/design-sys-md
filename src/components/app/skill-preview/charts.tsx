"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/**
 * Small hand written SVG charts. Every color is a CSS variable from the user's design system (chart-1 to
 * chart-5, border, card, text roles). The numbers here are chart geometry only (margins, marker size).
 *
 * Accessibility: each chart is `role="img"` with an aria-label that says what it shows, plus a visually hidden
 * data table. Series are told apart by lightness AND shape: line style plus marker for lines, a pattern for
 * bars and donut segments, direct labels where there is room.
 */

export interface Series {
  name: string;
  values: number[];
}

const color = (index: number) => `var(--chart-${index + 1})`;
const DASH = [undefined, "7 4", "2 4", "9 3 2 3", "1 5"] as const;
const MARKERS = ["circle", "square", "triangle", "diamond", "cross"] as const;
const LINE = 2;
const MARK = 4.5;

/** Width of an element in real pixels (not affected by the preview's scale), so chart text stays 12px. */
function useWidth(fallback = 480) {
  const ref = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(160, Math.floor(entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** A max and four equal steps that read as round numbers. */
function scaleFor(maxValue: number) {
  const raw = maxValue / 4;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 5, 10].map((n) => n * power).find((n) => n >= raw) ?? raw) as number;
  return { max: step * 4, ticks: [0, 1, 2, 3, 4].map((i) => i * step) };
}

const fmt = (n: number) => n.toLocaleString("en-US");

function Marker({ shape, x, y }: { shape: (typeof MARKERS)[number]; x: number; y: number }) {
  const common = { fill: "currentColor", stroke: "var(--card)", strokeWidth: 1.5 } as const;
  const r = MARK;
  if (shape === "square") return <rect {...common} x={x - r} y={y - r} width={r * 2} height={r * 2} />;
  if (shape === "triangle") return <polygon {...common} points={`${x},${y - r - 1} ${x + r + 1},${y + r} ${x - r - 1},${y + r}`} />;
  if (shape === "diamond") return <polygon {...common} points={`${x},${y - r - 1} ${x + r + 1},${y} ${x},${y + r + 1} ${x - r - 1},${y}`} />;
  if (shape === "cross") return <path d={`M${x - r} ${y - r}L${x + r} ${y + r}M${x + r} ${y - r}L${x - r} ${y + r}`} stroke="currentColor" strokeWidth={2.5} fill="none" />;
  return <circle {...common} cx={x} cy={y} r={r} />;
}

/** Fill patterns: solid first, then hatch, dots, lines, grid. They sit on the series color, so lightness still differs. */
function Patterns({ id, count }: { id: string; count: number }) {
  const mark = { stroke: "var(--card)", strokeWidth: 2 } as const;
  return (
    <defs>
      {Array.from({ length: count }, (_, k) => {
        const base = <rect width="8" height="8" fill={color(k)} />;
        if (k === 1) return <pattern key={k} id={`${id}-${k}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">{base}<line x1="0" y1="0" x2="0" y2="8" {...mark} /></pattern>;
        if (k === 2) return <pattern key={k} id={`${id}-${k}`} width="8" height="8" patternUnits="userSpaceOnUse">{base}<circle cx="4" cy="4" r="1.6" fill="var(--card)" /></pattern>;
        if (k === 3) return <pattern key={k} id={`${id}-${k}`} width="8" height="8" patternUnits="userSpaceOnUse">{base}<line x1="0" y1="4" x2="8" y2="4" {...mark} /></pattern>;
        if (k === 4) return <pattern key={k} id={`${id}-${k}`} width="8" height="8" patternUnits="userSpaceOnUse">{base}<path d="M0 4H8M4 0V8" {...mark} strokeWidth={1.5} /></pattern>;
        return null;
      })}
    </defs>
  );
}
const fillFor = (id: string, k: number) => (k === 0 || k > 4 ? color(k) : `url(#${id}-${k})`);

const cleanId = (raw: string) => `pvx${raw.replace(/[^a-zA-Z0-9]/g, "")}`;

/** A legend swatch drawn like the series itself: line style and marker, or the bar pattern. */
function Swatch({ kind, index }: { kind: "line" | "box"; index: number }) {
  const id = cleanId(useId());
  return (
    <svg width="28" height="14" viewBox="0 0 28 14" aria-hidden="true" style={{ flex: "none", color: color(index) }}>
      {kind === "line" ? (
        <>
          <line x1="1" y1="7" x2="27" y2="7" stroke="currentColor" strokeWidth={LINE} strokeDasharray={DASH[index]} />
          <Marker shape={MARKERS[index % MARKERS.length]} x={14} y={7} />
        </>
      ) : (
        <>
          <Patterns id={id} count={Math.min(index + 1, 5)} />
          <rect x="6" y="1" width="16" height="12" fill={fillFor(id, index)} />
        </>
      )}
    </svg>
  );
}

export function Legend({ items, kind }: { items: { name: string; value?: string }[]; kind: "line" | "box" }) {
  return (
    <ul className="pvx-legend">
      {items.map((item, index) => (
        <li key={item.name}>
          <Swatch kind={kind} index={index} />
          <span>{item.name}</span>
          {item.value ? <span className="pvx-legend__value">{item.value}</span> : null}
        </li>
      ))}
    </ul>
  );
}

/** The visually hidden data table that goes with every chart. */
function DataTable({ caption, labels, series, unit }: { caption: string; labels: string[]; series: Series[]; unit: string }) {
  return (
    <table className="pvx-sr">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{unit ? `Label (${unit})` : "Label"}</th>
          {series.map((s) => (
            <th scope="col" key={s.name}>
              {s.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {labels.map((label, i) => (
          <tr key={label + i}>
            <th scope="row">{label}</th>
            {series.map((s) => (
              <td key={s.name}>{fmt(s.values[i])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function summary(kind: string, title: string, unit: string, labels: string[], series: Series[]) {
  const parts = series.map((s) => {
    const peak = Math.max(...s.values);
    return `${s.name} goes from ${fmt(s.values[0])} to ${fmt(s.values[s.values.length - 1])}, highest ${fmt(peak)} at ${labels[s.values.indexOf(peak)]}`;
  });
  return `${kind}: ${title}${unit ? `, in ${unit}` : ""}. ${parts.join(". ")}.`;
}

interface FrameProps {
  title: string;
  unit: string;
  kind: string;
  labels: string[];
  series: Series[];
  height?: number;
  children: (w: number, h: number, maxScale: ReturnType<typeof scaleFor>) => ReactNode;
  overlay?: ReactNode;
  stacked?: boolean;
}

const M = { l: 44, r: 12, t: 12, b: 28 };

/** The shared frame: width measurement, y axis labels, hairline gridlines, summary and hidden table. */
function Frame({ title, unit, kind, labels, series, height = 220, children, overlay, stacked, rightPad = 0 }: FrameProps & { rightPad?: number }) {
  const [ref, width] = useWidth();
  const top = stacked ? Math.max(...labels.map((_, i) => series.reduce((sum, s) => sum + s.values[i], 0))) : Math.max(...series.flatMap((s) => s.values));
  const scale = scaleFor(top);
  const ih = height - M.t - M.b;
  const y = (v: number) => M.t + ih - (v / scale.max) * ih;
  return (
    <figure className="pvx-chart" ref={ref}>
      <div className="pvx-chart__plot" style={{ position: "relative" }}>
        <svg role="img" aria-label={summary(kind, title, unit, labels, series)} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {scale.ticks.map((tick) => (
            <g key={tick}>
              <line className="pvx-grid" x1={M.l} x2={width - M.r - rightPad} y1={y(tick)} y2={y(tick)} />
              <text className="pvx-axis" x={M.l - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle">
                {fmt(tick)}
              </text>
            </g>
          ))}
          {children(width, height, scale)}
        </svg>
        {overlay}
      </div>
      <DataTable caption={`${title}${unit ? ` (${unit})` : ""}`} labels={labels} series={series} unit={unit} />
    </figure>
  );
}

const xLabels = (labels: string[], x: (i: number) => number, height: number, every: number) =>
  labels.map((label, i) =>
    i % every === 0 ? (
      <text key={label + i} className="pvx-axis" x={x(i)} y={height - 8} textAnchor="middle">
        {label}
      </text>
    ) : null,
  );

/** Line chart (also the area chart: one series with a soft fill from a lighter step of the brand scale). */
export function LineChart({ title, unit, labels, series, area, tooltipAt, tooltip, height = 220 }: { title: string; unit: string; labels: string[]; series: Series[]; area?: boolean; tooltipAt?: number; tooltip?: ReactNode; height?: number }) {
  const n = labels.length;
  const top = Math.max(...series.flatMap((s) => s.values));
  const scale = scaleFor(top);
  return (
    <Frame
      title={title}
      unit={unit}
      kind={area ? "Area chart" : "Line chart"}
      labels={labels}
      series={series}
      height={height}
      overlay={tooltip && tooltipAt !== undefined ? <div className="pvx-tooltip-anchor" style={{ left: `calc(${M.l}px + (100% - ${M.l + M.r}px) * ${tooltipAt / (n - 1)})` }}>{tooltip}</div> : undefined}
    >
      {(w, h) => {
        const iw = w - M.l - M.r;
        const ih = h - M.t - M.b;
        const x = (i: number) => M.l + (iw * i) / (n - 1);
        const y = (v: number) => M.t + ih - (v / scale.max) * ih;
        const every = Math.ceil(n / Math.max(3, Math.floor(iw / 70)));
        return (
          <>
            {area ? <polygon points={`${x(0)},${y(0)} ${series[0].values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} ${x(n - 1)},${y(0)}`} fill="var(--brand-200)" /> : null}
            {tooltipAt !== undefined ? <line className="pvx-grid" x1={x(tooltipAt)} x2={x(tooltipAt)} y1={M.t} y2={y(0)} style={{ stroke: "var(--neutral-400)" }} /> : null}
            {series.map((s, k) => (
              <g key={s.name} style={{ color: color(k) }}>
                <polyline points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke="currentColor" strokeWidth={LINE} strokeDasharray={DASH[k]} strokeLinejoin="round" />
                {s.values.map((v, i) => (
                  <Marker key={i} shape={MARKERS[k % MARKERS.length]} x={x(i)} y={y(v)} />
                ))}
              </g>
            ))}
            {xLabels(labels, x, h, every)}
          </>
        );
      }}
    </Frame>
  );
}

/** A static tooltip sample for one data point: a popover with the date and a value per series. */
export function TooltipSample({ label, rows }: { label: string; rows: { name: string; value: string; index: number }[] }) {
  return (
    <div className="pvx-tooltip" role="note" aria-label={`Tooltip sample for ${label}`}>
      <strong>{label}</strong>
      {rows.map((row) => (
        <span key={row.name} className="pvx-tooltip__row">
          <Swatch kind="line" index={row.index} />
          {row.name}
          <span className="pvx-legend__value">{row.value}</span>
        </span>
      ))}
    </div>
  );
}

/** Bars. One series: direct value labels above the bars. Several: grouped, or stacked with direct labels. */
export function BarChart({ title, unit, labels, series, mode = "grouped", height = 220 }: { title: string; unit: string; labels: string[]; series: Series[]; mode?: "grouped" | "stacked"; height?: number }) {
  const id = cleanId(useId());
  const n = labels.length;
  const stacked = mode === "stacked";
  const single = series.length === 1;
  const totals = labels.map((_, i) => series.reduce((sum, s) => sum + s.values[i], 0));
  const scale = scaleFor(stacked ? Math.max(...totals) : Math.max(...series.flatMap((s) => s.values)));
  const rightPad = stacked ? 72 : 0;
  return (
    <Frame title={title} unit={unit} kind={stacked ? "Stacked bar chart" : single ? "Bar chart" : "Grouped bar chart"} labels={labels} series={series} height={height} stacked={stacked} rightPad={rightPad}>
      {(w, h) => {
        const iw = w - M.l - M.r - rightPad;
        const ih = h - M.t - M.b;
        const band = iw / n;
        const y = (v: number) => M.t + ih - (v / scale.max) * ih;
        const inner = band * 0.68;
        const barW = stacked || single ? Math.min(inner, 72) : inner / series.length;
        const x0 = (i: number) => M.l + band * i + (band - (stacked || single ? barW : inner)) / 2;
        return (
          <>
            <Patterns id={id} count={single ? 1 : series.length} />
            {labels.map((label, i) => (
              <g key={label}>
                {series.map((s, k) => {
                  if (stacked) {
                    const below = series.slice(0, k).reduce((sum, t) => sum + t.values[i], 0);
                    return <rect key={s.name} x={x0(i)} width={barW} y={y(below + s.values[i])} height={y(below) - y(below + s.values[i])} fill={fillFor(id, k)} stroke="var(--card)" strokeWidth={1.5} />;
                  }
                  const bx = single ? x0(i) : x0(i) + k * barW;
                  return (
                    <g key={s.name}>
                      <rect x={bx} width={barW - (single ? 0 : 2)} y={y(s.values[i])} height={y(0) - y(s.values[i])} fill={single ? color(0) : fillFor(id, k)} style={{ rx: "var(--radius-sm)" }} />
                      {single ? (
                        <text className="pvx-value" x={bx + barW / 2} y={y(s.values[i]) - 6} textAnchor="middle">
                          {fmt(s.values[i])}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
                <text className="pvx-axis" x={M.l + band * i + band / 2} y={h - 8} textAnchor="middle">
                  {label}
                </text>
              </g>
            ))}
            {stacked
              ? series.map((s, k) => {
                  const below = series.slice(0, k).reduce((sum, t) => sum + t.values[labels.length - 1], 0);
                  return (
                    <text key={s.name} className="pvx-value" x={M.l + iw + 8} y={y(below + s.values[labels.length - 1] / 2)} dominantBaseline="middle">
                      {s.name}
                    </text>
                  );
                })
              : null}
          </>
        );
      }}
    </Frame>
  );
}

/** A donut with a pattern per segment; the legend lists the values. */
export function Donut({ title, unit, data }: { title: string; unit: string; data: { name: string; value: number }[] }) {
  const id = cleanId(useId());
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const size = 168;
  const c = size / 2;
  const outer = c - 4;
  const inner = outer * 0.62;
  const arcs = data.map((d, k) => {
    const sweep = (d.value / total) * Math.PI * 2;
    const a0 = -Math.PI / 2 + (data.slice(0, k).reduce((sum, t) => sum + t.value, 0) / total) * Math.PI * 2;
    const a1 = a0 + sweep;
    const pt = (r: number, a: number) => `${c + r * Math.cos(a)} ${c + r * Math.sin(a)}`;
    const large = sweep > Math.PI ? 1 : 0;
    return { k, d: `M${pt(outer, a0)} A${outer} ${outer} 0 ${large} 1 ${pt(outer, a1)} L${pt(inner, a1)} A${inner} ${inner} 0 ${large} 0 ${pt(inner, a0)} Z` };
  });
  const aria = `Donut chart: ${title}, in ${unit}. ${data.map((d) => `${d.name} ${d.value} percent`).join(", ")}.`;
  return (
    <figure className="pvx-donut">
      <svg role="img" aria-label={aria} width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flex: "none" }}>
        <Patterns id={id} count={data.length} />
        {arcs.map((arc) => (
          <path key={arc.k} d={arc.d} fill={fillFor(id, arc.k)} stroke="var(--card)" strokeWidth={2} />
        ))}
        <text className="pvx-value" x={c} y={c - 2} textAnchor="middle" style={{ fontSize: "var(--text-xl)", fontWeight: 600 }}>
          {total}%
        </text>
        <text className="pvx-axis" x={c} y={c + 16} textAnchor="middle">
          of visits
        </text>
      </svg>
      <Legend kind="box" items={data.map((d) => ({ name: d.name, value: `${d.value}%` }))} />
      <table className="pvx-sr">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Source</th>
            <th scope="col">Share (%)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.name}>
              <th scope="row">{d.name}</th>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** A tiny line without axes, for a metric card. The end point has a marker. */
export function Sparkline({ title, values }: { title: string; values: number[] }) {
  const [ref, width] = useWidth(160);
  const h = 40;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const x = (i: number) => 4 + ((width - 8) * i) / (values.length - 1);
  const y = (v: number) => 4 + (h - 8) * (1 - (v - lo) / (hi - lo));
  return (
    <figure className="pvx-chart" ref={ref}>
      <svg role="img" aria-label={`Sparkline: ${title}. Rises from ${values[0]} to ${values[values.length - 1]} over ${values.length} days.`} width={width} height={h} viewBox={`0 0 ${width} ${h}`} style={{ color: color(0) }}>
        <polyline points={values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke="currentColor" strokeWidth={LINE} strokeLinejoin="round" />
        <Marker shape="circle" x={x(values.length - 1)} y={y(values[values.length - 1])} />
      </svg>
      <table className="pvx-sr">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {values.map((v, i) => (
            <tr key={i}>
              <th scope="row">{i + 1}</th>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
