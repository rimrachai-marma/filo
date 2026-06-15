import React from "react";
import { Subscription } from "@/types";

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

interface Props {
  subscriptions: Subscription[];
}

const SubscriptionHistory: React.FC<Props> = ({ subscriptions }) => {
  if (subscriptions.length === 0) {
    return <p className="text-sm text-text-muted">No history yet.</p>;
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-border">
      <table className="w-full">
        <thead>
          <tr className="bg-surface border-b border-border">
            {["Plan", "Start Date", "End Date", "Status"].map((h) => (
              <th key={h} className="px-5 py-3 text-left text-xs font-medium text-text-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((sub) => {
            return (
              <tr
                key={sub.id}
                className="border-b border-border last:border-0 bg-surface-2"
                style={
                  {
                    "--tc": sub.package.tierColor,
                  } as React.CSSProperties
                }
              >
                <td className="px-5 py-3">
                  <span className="font-semibold text-sm text-(--tc)">{sub.package.displayName}</span>
                </td>
                <td className="px-5 py-3 text-sm text-text-muted">{fmt(sub.startDate)}</td>
                <td className="px-5 py-3 text-sm text-text-muted">{sub.endDate ? fmt(sub.endDate) : "—"}</td>
                <td className="px-5 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium border ${sub.isActive ? "border-[color-mix(in_srgb,var(--tc)_35%,transparent)] bg-[color-mix(in_srgb,var(--tc)_8%,transparent)]" : "border-color-border bg-color-surface"} `}
                  >
                    {sub.isActive ? "Active" : "Expired"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SubscriptionHistory;
