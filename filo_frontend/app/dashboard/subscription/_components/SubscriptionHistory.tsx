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
    <div className="rounded-2xl overflow-hidden border border-border overflow-x-auto">
      <table className="w-full min-w-[300px]">
        <thead>
          <tr className="bg-surface border-b border-border">
            <th className="px-5 py-3 text-left text-xs font-medium text-text-muted">Plan</th>

            {/* Start / End — hidden on mobile, folded into Plan cell as subtext instead */}
            <th className="px-5 py-3 text-left text-xs font-medium text-text-muted hidden sm:table-cell">Start Date</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-text-muted hidden sm:table-cell">End Date</th>

            <th className="px-5 py-3 text-left text-xs font-medium text-text-muted">Status</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((sub) => (
            <tr
              key={sub.id}
              className="border-b border-border last:border-0 bg-surface-2"
              style={{ "--tc": sub.package.tierColor } as React.CSSProperties}
            >
              {/* Plan — carries date range as subtext on mobile only */}
              <td className="px-5 py-3">
                <span className="font-semibold text-sm text-(--tc)">{sub.package.displayName}</span>
                <p className="sm:hidden text-xs text-text-muted mt-0.5">
                  {fmt(sub.startDate)} — {sub.endDate ? fmt(sub.endDate) : "present"}
                </p>
              </td>

              <td className="px-5 py-3 text-sm text-text-muted whitespace-nowrap hidden sm:table-cell">
                {fmt(sub.startDate)}
              </td>

              <td className="px-5 py-3 text-sm text-text-muted whitespace-nowrap hidden sm:table-cell">
                {sub.endDate ? fmt(sub.endDate) : "—"}
              </td>

              <td className="px-5 py-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium border whitespace-nowrap ${
                    sub.isActive
                      ? "border-[color-mix(in_srgb,var(--tc)_35%,transparent)] bg-[color-mix(in_srgb,var(--tc)_8%,transparent)] text-(--tc)"
                      : "border-border bg-surface text-text-muted"
                  }`}
                >
                  {sub.isActive ? "Active" : "Expired"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubscriptionHistory;
