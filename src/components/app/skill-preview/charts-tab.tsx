"use client";

import { Inbox } from "lucide-react";
import { contrastRatio, useDesignSystem } from "@/lib/design-system";
import { PvIcon } from "../preview-icon";
import { BarChart, Donut, Legend, LineChart, Sparkline } from "./charts";
import { BY_CHANNEL, BY_TIER, METRICS, REQUESTS, SOURCES, SPARK, VISITORS } from "./sample-data";

const MARKERS = ["circle", "square", "triangle", "diamond", "cross"];

/** Every chart type the skill file covers, plus the chart color strip, a loading card and an empty card. */
export function ChartsTab() {
  const { tokens } = useDesignSystem();
  const { roles, brand, chartCheck, brandReport } = tokens.colors;
  const chart = [1, 2, 3, 4, 5].map((n) => roles[`chart-${n}` as "chart-1"]);
  const chart1Step = (Object.entries(brand).find(([, hex]) => hex.toUpperCase() === chart[0].toUpperCase())?.[0]) ?? "600";
  const adjusted = chart1Step !== "600";
  const metric = METRICS[0];
  return (
    <div className="pvx-page">
      <div className="pvx-head">
        <h1>Charts</h1>
        <p>Every chart type in the file. Sample content, invented numbers.</p>
      </div>

      <div className="card">
        <div className="pvx-card-head">
          <h2>Chart colors</h2>
          <p className="pvx-note">Used in this order, never reordered. Contrast is measured on the page background (3:1 needed).</p>
        </div>
        <ul className="pvx-colors">
          {chart.map((hex, index) => {
            const ratio = contrastRatio(hex, roles.background);
            return (
              <li key={index}>
                <span className="pvx-colors__swatch" style={{ background: hex }} aria-hidden="true" />
                <strong>chart-{index + 1}</strong>
                <span className="pvx-note pvx-mono">{hex}</span>
                <span className="pvx-note">
                  {ratio.toFixed(2)}:1 {ratio >= 3 ? "passes" : "below 3:1"}
                </span>
                <span className="pvx-note">Marker: {MARKERS[index]}</span>
              </li>
            );
          })}
        </ul>
        <p className="pvx-note">
          {adjusted
            ? `Chart 1 is your brand color at step ${chart1Step}, because step 600 is below 3:1 on the page. `
            : "Chart 1 is your brand color (step 600). "}
          Charts 2 to 5 are spaced around the hue wheel from your brand hue and their lightness was searched so each reaches 3:1.{brandReport.mode === "adjusted" ? " Your adjusted brand color is used." : ""}{" "}
          {chartCheck.passes
            ? `Color blind check passes: the closest pair differs by ${chartCheck.minDistance} (needs ${chartCheck.threshold}), under normal vision ${chartCheck.perVision.normal}, deuteranopia ${chartCheck.perVision.deuteranopia}, protanopia ${chartCheck.perVision.protanopia}, tritanopia ${chartCheck.perVision.tritanopia}.`
            : `Color blind check: charts ${chartCheck.worstPair.join(" and ")} are close under ${chartCheck.worstVision} (${chartCheck.minDistance}, below ${chartCheck.threshold}), so every chart also uses a marker, line style or pattern.`}
        </p>
      </div>

      <div className="pvx-grid2">
        <div className="card">
          <div className="pvx-card-head">
            <h2>Line, 2 series</h2>
            <p className="pvx-note">Solid with circles, dashed with squares.</p>
          </div>
          <Legend kind="line" items={REQUESTS.series.map((s) => ({ name: s.name }))} />
          <LineChart title="Requests over time" unit="thousands of requests per day" labels={REQUESTS.labels} series={REQUESTS.series} />
        </div>
        <div className="card">
          <div className="pvx-card-head">
            <h2>Area, 1 series</h2>
            <p className="pvx-note">Soft fill is a lighter step of the brand scale.</p>
          </div>
          <LineChart title="Visitors per day" unit="visitors per day" labels={VISITORS.labels} series={VISITORS.series} area />
        </div>
        <div className="card">
          <div className="pvx-card-head">
            <h2>Grouped bars, 3 series</h2>
            <p className="pvx-note">Solid, hatch and dots tell the series apart.</p>
          </div>
          <Legend kind="box" items={BY_CHANNEL.series.map((s) => ({ name: s.name }))} />
          <BarChart title="Sessions by channel" unit="thousands of sessions" labels={BY_CHANNEL.labels} series={BY_CHANNEL.series} />
        </div>
        <div className="card">
          <div className="pvx-card-head">
            <h2>Stacked bars, 3 segments</h2>
            <p className="pvx-note">Segments are labeled directly on the right.</p>
          </div>
          <BarChart title="Accounts by tier" unit="accounts" labels={BY_TIER.labels} series={BY_TIER.series} mode="stacked" />
        </div>
        <div className="card">
          <div className="pvx-card-head">
            <h2>Donut, 4 segments</h2>
            <p className="pvx-note">Share of visits by source.</p>
          </div>
          <Donut title="Visits by source" unit="percent of visits" data={SOURCES} />
        </div>
        <div className="card pvx-statcard">
          <p className="stat__label">{metric.label}</p>
          <p className="stat__value">{metric.value}</p>
          <Sparkline title="Requests over 12 days" values={SPARK} />
          <p className="stat__label">Metric card with a sparkline. Sample content.</p>
        </div>
      </div>

      <div className="pvx-grid2">
        <div className="card" aria-busy="true">
          <div className="pvx-card-head">
            <h2>Loading</h2>
            <p className="pvx-note">A skeleton shaped like the chart it replaces.</p>
          </div>
          <div className="pvx-skel" role="status" aria-label="Loading chart">
            {[40, 64, 52, 80, 68, 92, 76].map((h, i) => (
              <span key={i} className="skeleton" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="card">
          <div className="pvx-card-head">
            <h2>Empty</h2>
            <p className="pvx-note">The empty state recipe, inside a chart card.</p>
          </div>
          <div className="pvx-empty">
            <PvIcon icon={Inbox} size={24} />
            <h2>No data yet</h2>
            <p className="pvx-note">Numbers show up here once there is activity to count.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
