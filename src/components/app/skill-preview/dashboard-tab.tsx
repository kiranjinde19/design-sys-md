"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Boxes, ChartColumn, CreditCard, FolderKanban, LayoutDashboard, Minus, PanelLeft, Settings, Users } from "lucide-react";
import { PvIcon } from "../preview-icon";
import { BarChart, Legend, LineChart, TooltipSample } from "./charts";
import { ACTIVITY, BY_PLAN, METRICS, requestsFor } from "./sample-data";

const NAV = [
  { group: "Workspace", items: [{ label: "Overview", icon: LayoutDashboard, current: true }, { label: "Projects", icon: FolderKanban }, { label: "Reports", icon: ChartColumn }] },
  { group: "Account", items: [{ label: "Team", icon: Users }, { label: "Billing", icon: CreditCard }, { label: "Settings", icon: Settings }] },
] as const;

const RANGES = ["7 days", "30 days", "90 days"] as const;
const TREND = { up: { icon: ArrowUp, badge: "badge tone-success" }, down: { icon: ArrowDown, badge: "badge tone-error" }, flat: { icon: Minus, badge: "badge" } } as const;

/** An app screen drawn with the skill file's own shell, metric card, chart and table recipes. */
export function DashboardTab() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("30 days");
  const requests = requestsFor(range);
  const tooltipAt = Math.round((requests.labels.length - 1) * 0.66);
  return (
    <div className="shell pvx-dash">
      <aside className="sidebar pvx-sidebar" aria-label="Sample navigation">
        <div className="pvx-brand">
          <span className="pvx-brand__tile" aria-hidden="true">
            <PvIcon icon={Boxes} size={20} />
          </span>
          <strong>Sample app</strong>
        </div>
        {NAV.map((group) => (
          <nav key={group.group} aria-label={group.group} className="pvx-navgroup">
            <p className="pvx-navlabel">{group.group}</p>
            {group.items.map((item) => (
              <a key={item.label} href="#sample" className="nav-item" aria-current={"current" in item ? "page" : undefined} onClick={(event) => event.preventDefault()}>
                <PvIcon icon={item.icon} />
                {item.label}
              </a>
            ))}
          </nav>
        ))}
      </aside>

      <div className="shell__main">
        <header className="header pvx-header">
          <button type="button" className="btn btn--tertiary pvx-icon" aria-label="Toggle sidebar" style={{ width: "var(--control-h)" }}>
            <PvIcon icon={PanelLeft} />
          </button>
          <button type="button" className="avatar pvx-avatar" aria-label="Account menu">
            AM
          </button>
        </header>

        <main className="page">
          <div className="pvx-split">
            <div className="pvx-head">
              <h1>Overview</h1>
              <p>Sample content. The numbers are invented.</p>
            </div>
            <div className="pvx-seg" role="group" aria-label="Date range">
              {RANGES.map((name) => (
                <button key={name} type="button" aria-pressed={name === range} onClick={() => setRange(name)}>
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="stats pvx-stats">
            {METRICS.map((metric) => {
              const trend = TREND[metric.trend];
              return (
                <div key={metric.label} className="card">
                  <p className="stat__label">{metric.label}</p>
                  <p className="stat__value">{metric.value}</p>
                  <p className="pvx-statrow">
                    <span className={trend.badge}>
                      <PvIcon icon={trend.icon} size={16} />
                      {metric.change}
                      <span className="pvx-sr">{metric.trend === "up" ? " up" : metric.trend === "down" ? " down" : " no change"}</span>
                    </span>
                    <span className="stat__label">{metric.help}</span>
                  </p>
                </div>
              );
            })}
          </div>

          <div className="pvx-charts">
            <div className="card">
              <div className="pvx-card-head">
                <h2>Requests over time</h2>
                <p className="pvx-note">Thousands of requests per day. Sample content.</p>
              </div>
              <Legend kind="line" items={requests.series.map((s) => ({ name: s.name }))} />
              <LineChart
                title="Requests over time"
                unit="thousands of requests per day"
                labels={requests.labels}
                series={requests.series}
                tooltipAt={tooltipAt}
                tooltip={<TooltipSample label={requests.labels[tooltipAt]} rows={requests.series.map((s, index) => ({ name: s.name, value: String(s.values[tooltipAt]), index }))} />}
              />
            </div>
            <div className="card">
              <div className="pvx-card-head">
                <h2>By plan</h2>
                <p className="pvx-note">Accounts per plan. Sample content.</p>
              </div>
              <BarChart title="Accounts by plan" unit="accounts" labels={BY_PLAN.labels} series={BY_PLAN.series} />
            </div>
          </div>

          <div className="card">
            <div className="pvx-card-head">
              <h2>Recent activity</h2>
              <p className="pvx-note">The latest events in this workspace.</p>
            </div>
            <div className="pvx-table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Event</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="num">
                      Items
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ACTIVITY.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.event}</td>
                      <td>
                        <span className={`badge ${row.tone}`}>{row.status}</span>
                      </td>
                      <td className="num">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
