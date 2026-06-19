export function FolderGridSkeleton() {
  return (
    <section className="mb-8">
      <div className="h-4 w-32 mb-3 rounded-lg bg-surface-2 animate-pulse" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-xl p-4 bg-surface border border-border">
            <div className="flex items-start justify-between mb-2">
              <div className="w-6 h-6 rounded-lg bg-surface-2 animate-pulse" />
              <div className="w-6 h-6 rounded-lg bg-surface-2 animate-pulse" />
            </div>
            <div className="h-4 w-24 rounded-lg bg-surface-2 animate-pulse mb-2" />
            <div className="flex gap-2">
              <div className="flex-1 h-3 rounded-lg bg-surface-2 animate-pulse" />
              <div className="flex-1 h-3 rounded-lg bg-surface-2 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FileTableSkeleton() {
  return (
    <section>
      <div className="h-4 w-32 mb-3 rounded-lg bg-surface-2 animate-pulse" />

      <div className="rounded-2xl overflow-hidden border border-border overflow-x-auto">
        <table className="w-full min-w-[420px]">
          <thead>
            <tr className="bg-surface border-b border-border">
              <th className="px-4 py-3 text-left">
                <div className="h-3 w-16 bg-surface-2 rounded-lg animate-pulse" />
              </th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">
                <div className="h-3 w-12 bg-surface-2 rounded-lg animate-pulse" />
              </th>
              <th className="px-4 py-3 text-left">
                <div className="h-3 w-10 bg-surface-2 rounded-lg animate-pulse" />
              </th>
              <th className="px-4 py-3 text-left hidden md:table-cell">
                <div className="h-3 w-16 bg-surface-2 rounded-lg animate-pulse" />
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border last:border-0 bg-surface-2">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-[17px] h-[17px] shrink-0 rounded bg-surface-3 animate-pulse" />
                    <div className="h-4 w-24 sm:w-32 bg-surface-3 rounded-lg animate-pulse" />
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <div className="h-4 w-14 bg-surface-3 rounded-lg animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-12 bg-surface-3 rounded-lg animate-pulse" />
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="h-4 w-20 bg-surface-3 rounded-lg animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-surface-3 animate-pulse" />
                    <div className="w-6 h-6 rounded-lg bg-surface-3 animate-pulse hidden sm:block" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function SubscriptionPageSkeleton() {
  return (
    <>
      <div className="mb-8">
        <div className="h-8 w-48 rounded-lg bg-surface-2 animate-pulse mb-2" />
        <div className="h-4 w-64 rounded-lg bg-surface-2 animate-pulse" />
      </div>

      {/* Plans skeleton */}
      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-5 bg-surface border border-border">
              <div className="h-3 w-12 rounded bg-surface-2 animate-pulse mb-2" />
              <div className="h-6 w-20 rounded-lg bg-surface-2 animate-pulse mb-4" />

              <div className="space-y-2 mb-4">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <div className="h-3 w-16 rounded bg-surface-2 animate-pulse" />
                    <div className="h-3 w-10 rounded bg-surface-2 animate-pulse" />
                  </div>
                ))}
              </div>

              <div className="h-9 w-full rounded-xl bg-surface-2 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* History skeleton */}
      <div>
        <div className="h-6 w-40 rounded-lg bg-surface-2 animate-pulse mb-4" />
        <div className="rounded-2xl overflow-hidden border border-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-3 border-b border-border last:border-0 bg-surface-2"
            >
              <div className="h-4 w-16 rounded bg-surface-3 animate-pulse" />
              <div className="h-3 w-20 rounded bg-surface-3 animate-pulse hidden sm:block" />
              <div className="h-3 w-20 rounded bg-surface-3 animate-pulse hidden sm:block" />
              <div className="h-4 w-14 rounded-full bg-surface-3 animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function FolderContentSkeleton() {
  return (
    <>
      <FolderGridSkeleton />
      <FileTableSkeleton />
    </>
  );
}

export function PackageGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl p-6 bg-surface border border-border">
          <div className="h-6 w-20 rounded-lg bg-surface-2 animate-pulse mb-3" />
          <div className="h-4 w-32 rounded-lg bg-surface-2 animate-pulse mb-4" />
          <div className="space-y-2 mb-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-3 w-full rounded-lg bg-surface-2 animate-pulse" />
            ))}
          </div>
          <div className="h-10 w-full rounded-lg bg-surface-2 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function StorageDashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Overview card */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="h-3 w-24 rounded bg-surface-2 animate-pulse mb-2" />
            <div className="h-7 w-40 rounded-lg bg-surface-2 animate-pulse" />
          </div>
          {/* Plan badge — hidden on the smallest screens, matches real layout flow */}
          <div className="h-6 w-20 rounded-full bg-surface-2 animate-pulse hidden xs:block" />
        </div>

        {/* Stacked bar */}
        <div className="h-3 rounded-full bg-surface-3 animate-pulse" />
        <div className="h-3 w-48 rounded bg-surface-2 animate-pulse mt-2" />

        {/* Type cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface-2 p-3">
              <div className="h-3 w-14 rounded bg-surface-3 animate-pulse mb-2" />
              <div className="h-4 w-16 rounded bg-surface-3 animate-pulse mb-1" />
              <div className="h-3 w-10 rounded bg-surface-3 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-5">
            <div className="h-3 w-20 rounded bg-surface-2 animate-pulse mb-2" />
            <div className="h-7 w-12 rounded-lg bg-surface-2 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Largest Files */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <div className="h-4 w-28 rounded bg-surface-2 animate-pulse" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0">
            <div className="w-3.5 h-3.5 shrink-0 rounded bg-surface-2 animate-pulse" />
            <div className="flex-1 min-w-0 h-4 max-w-[60%] rounded bg-surface-2 animate-pulse" />
            <div className="h-3 w-12 shrink-0 rounded bg-surface-2 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SharesListSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-40 rounded-lg bg-surface-2 animate-pulse" />

      <div className="rounded-2xl overflow-hidden border border-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-4 py-3 border-b border-border last:border-0 bg-surface">
            {/* Icon */}
            <div className="w-4 h-4 shrink-0 rounded bg-surface-2 animate-pulse" />

            {/* Name + URL */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="h-3.5 w-28 rounded bg-surface-2 animate-pulse" />
              <div className="h-3 w-40 sm:w-56 rounded bg-surface-2 animate-pulse" />
            </div>

            {/* Expiry — hidden on mobile, matches real component */}
            <div className="h-3 w-16 rounded bg-surface-2 animate-pulse shrink-0 hidden sm:block" />

            {/* Copy + revoke buttons */}
            <div className="w-6 h-6 rounded-lg bg-surface-2 animate-pulse shrink-0" />
            <div className="w-6 h-6 rounded-lg bg-surface-2 animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
