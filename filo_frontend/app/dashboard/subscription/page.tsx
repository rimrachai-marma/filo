import React, { Suspense } from "react";

import type { Package, Subscription } from "@/types";
import { get } from "@/lib/api.server";
import Plans from "./_components/Plans";
import { SidebarTrigger } from "@/components/Sidebar/SidebarTrigger";
import SubscriptionHistory from "./_components/SubscriptionHistory";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SubscriptionPageSkeleton } from "@/components/ui/Skeleton";

export default async function SubscriptionPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-30 flex flex-col gap-2 h-16 px-6 justify-center border-b border-border bg-surface backdrop-blur-sm">
        <div className="flex items-center">
          <SidebarTrigger />
        </div>
      </div>

      <div className="p-8 w-full mx-auto max-w-5xl">
        <Suspense fallback={<SubscriptionPageSkeleton />}>
          <ErrorBoundary>
            <PakagesSubcriptionHistory />
          </ErrorBoundary>
        </Suspense>
      </div>
    </div>
  );
}

async function PakagesSubcriptionHistory() {
  const [packages, subs] = await Promise.all([
    get<Package[]>({ path: "/packages" }),
    get<Subscription[]>({ path: "/subscriptions" }),
  ]);

  if (packages.status !== "success" || subs.status !== "success") {
    throw new Error("Failed to load subscription data");
  }

  return (
    <div className="flex-1">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-text">Subscription</h1>
        <p className="text-sm mt-1 text-text-muted">Choose the plan that fits your needs</p>
      </div>

      <Plans packages={packages.data} subscriptions={subs.data} />

      <div>
        <h2 className="text-lg font-display font-semibold mb-4 text-text">Subscription History</h2>

        <SubscriptionHistory subscriptions={subs.data} />
      </div>
    </div>
  );
}
