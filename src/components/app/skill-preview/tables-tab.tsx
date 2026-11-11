"use client";

import { Ellipsis, Inbox } from "lucide-react";
import { PvIcon } from "../preview-icon";
import { useVoiceCopy } from "../use-voice-copy";

/** Invented people and example.com addresses only. */
const PEOPLE = [
  { name: "Alex Morgan", email: "alex.morgan@example.com", role: "Admin", active: true, usage: "1,284" },
  { name: "Sam Rivera", email: "sam.rivera@example.com", role: "Editor", active: true, usage: "842" },
  { name: "Jordan Lee", email: "jordan.lee@example.com", role: "Editor", active: false, usage: "56" },
  { name: "Taylor Kim", email: "taylor.kim@example.com", role: "Viewer", active: true, usage: "1,019" },
  { name: "Casey Patel", email: "casey.patel@example.com", role: "Viewer", active: false, usage: "312" },
] as const;

const Dots = () => <PvIcon icon={Ellipsis} />;

/** A "Team members" card with a table, drawn with the skill file's own classes. */
export function TablesTab() {
  const copy = useVoiceCopy();
  return (
    <div className="pvx-page">
      <div className="pvx-head">
        <h1>Team</h1>
        <p>People with access to this workspace. Sample content.</p>
      </div>

      <div className="card">
        <div className="pvx-card-head">
          <h2>Team members</h2>
          <p className="pvx-note">Usage is requests this month.</p>
        </div>
        <div className="pvx-table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col" className="num">
                  Usage
                </th>
                <th scope="col">
                  <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {PEOPLE.map((person) => (
                <tr key={person.email}>
                  <td>{person.name}</td>
                  <td>{person.email}</td>
                  <td>{person.role}</td>
                  <td>
                    <span className={`badge${person.active ? " tone-success" : ""}`}>{person.active ? "Active" : "Invited"}</span>
                  </td>
                  <td className="num">{person.usage}</td>
                  <td>
                    <button type="button" className="btn btn--tertiary btn--sm pvx-icon" aria-label={`More actions for ${person.name}`} style={{ width: "var(--control-h-sm)", padding: 0 }}>
                      <Dots />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pvx-split" style={{ marginTop: "var(--gap-stack)" }}>
          <p className="pvx-note">Showing 1 to 5 of 12</p>
          <div className="pvx-actions">
            <button type="button" className="btn btn--secondary btn--sm">
              Previous
            </button>
            <button type="button" className="btn btn--secondary btn--sm">
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="card pvx-empty">
        <PvIcon icon={Inbox} size={24} />
        <h2>{copy.empty.main}</h2>
        {copy.empty.extra ? <p className="pvx-note">{copy.empty.extra}</p> : null}
      </div>
    </div>
  );
}
