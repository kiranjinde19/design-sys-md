/** Sample content for the Dashboard and Charts tabs: invented names, round numbers, nothing real. */

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

/** Requests over time, in thousands. Two series. */
export const REQUESTS = {
  labels: DAYS,
  series: [
    { name: "This period", values: [12, 15, 14, 19, 22, 18, 21, 25, 24, 28, 27, 31] },
    { name: "Previous period", values: [9, 11, 13, 12, 15, 14, 16, 17, 19, 18, 22, 24] },
  ],
};

/** One series, for the area chart. */
export const VISITORS = { labels: DAYS, series: [{ name: "Visitors", values: [20, 24, 22, 30, 34, 28, 33, 38, 36, 42, 40, 46] }] };

export const BY_PLAN = { labels: ["Starter", "Pro", "Team"], series: [{ name: "Accounts", values: [40, 120, 80] }] };

/** Three series over four months, for grouped bars. */
export const BY_CHANNEL = {
  labels: ["Jan", "Feb", "Mar", "Apr"],
  series: [
    { name: "Web", values: [40, 52, 48, 60] },
    { name: "Mobile", values: [28, 34, 42, 46] },
    { name: "API", values: [16, 22, 26, 34] },
  ],
};

/** Three segments per bar, for stacked bars with direct labels. */
export const BY_TIER = {
  labels: ["Jan", "Feb", "Mar", "Apr"],
  series: [
    { name: "Free", values: [30, 34, 36, 40] },
    { name: "Pro", values: [20, 26, 30, 34] },
    { name: "Team", values: [10, 12, 16, 20] },
  ],
};

export const SOURCES = [
  { name: "Email", value: 40 },
  { name: "Search", value: 30 },
  { name: "Referral", value: 20 },
  { name: "Social", value: 10 },
];

export const SPARK = [12, 14, 13, 17, 16, 20, 19, 23, 22, 26, 25, 30];

export const METRICS = [
  { label: "Requests", value: "24,000", change: "8%", trend: "up", help: "Compared with the previous period" },
  { label: "Active users", value: "1,200", change: "3%", trend: "up", help: "Signed in at least once" },
  { label: "Conversion rate", value: "4.0%", change: "0.5%", trend: "down", help: "Visitors who started a trial" },
  { label: "Response time", value: "180 ms", change: "0%", trend: "flat", help: "Median, all endpoints" },
] as const;

export const ACTIVITY = [
  { name: "Alex Morgan", event: "Created a project", status: "Complete", tone: "tone-success", count: "12" },
  { name: "Sam Rivera", event: "Invited a teammate", status: "Pending", tone: "tone-warning", count: "3" },
  { name: "Jordan Lee", event: "Exported a report", status: "Complete", tone: "tone-success", count: "48" },
  { name: "Taylor Kim", event: "Updated billing details", status: "Failed", tone: "tone-error", count: "1" },
  { name: "Casey Patel", event: "Joined the workspace", status: "Complete", tone: "tone-success", count: "7" },
] as const;

export type DateRange = "7 days" | "30 days" | "90 days";

/** A fixed sample "today", so the dates on the axis are sample content too. */
const ANCHOR = Date.UTC(2026, 10, 11);
const DAY = 86_400_000;
const date = (daysAgo: number) => new Date(ANCHOR - daysAgo * DAY).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const weekday = (daysAgo: number) => new Date(ANCHOR - daysAgo * DAY).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });

/** The requests chart for a date range: weekday names for 7 days, dates (like "Oct 12") for 30 and 90 days. */
export function requestsFor(range: DateRange) {
  if (range === "7 days") {
    return { labels: Array.from({ length: 7 }, (_, i) => weekday(6 - i)), series: REQUESTS.series.map((s) => ({ ...s, values: s.values.slice(5) })) };
  }
  const span = range === "30 days" ? 30 : 90;
  const n = REQUESTS.labels.length;
  return { labels: Array.from({ length: n }, (_, i) => date(Math.round(span - (span * i) / (n - 1)))), series: REQUESTS.series };
}
