import React, { Suspense } from "react";

import { get } from "@/lib/api.server";
import type { Package } from "@/types";
import Packages from "./_components/Packages";
import NewPackageCreate from "./_components/NewPackageCreate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PackageGridSkeleton } from "@/components/ui/Skeleton";

export default async function AdminDashboardPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-display font-bold text-text">Subscription Packages</h2>
          <p className="text-sm mt-1 text-text-muted">Create and manage subscription plans</p>
        </div>
        <NewPackageCreate />
      </div>
      <Suspense fallback={<PackageGridSkeleton />}>
        <ErrorBoundary>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <PackageList />
          </div>
        </ErrorBoundary>
      </Suspense>
    </main>
  );
}

function PackageList() {
  const res = React.use(get<Package[]>({ path: "/admin/packages", tokenKind: "admin" }));

  if (res.status === "error") {
    throw new Error(res.message);
  }

  return <Packages packages={res.data} />;
}
