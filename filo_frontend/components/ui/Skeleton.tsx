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
      <div className="rounded-2xl overflow-hidden border border-border">
        <table className="w-full">
          <thead>
            <tr className="bg-surface border-b border-border">
              {["Name", "Type", "Size", "Uploaded", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium">
                  <div className="h-3 w-16 bg-surface-2 rounded-lg animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border bg-surface">
                <td className="px-4 py-3">
                  <div className="h-4 w-32 bg-surface-3 rounded-lg animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-12 bg-surface-3 rounded-lg animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-16 bg-surface-3 rounded-lg animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-20 bg-surface-3 rounded-lg animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-12 bg-surface-3 rounded-lg animate-pulse" />
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl p-6 bg-surface border border-border">
              <div className="h-6 w-20 rounded-lg bg-surface-2 animate-pulse mb-3" />
              <div className="h-8 w-28 rounded-lg bg-surface-2 animate-pulse mb-4" />

              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-3 w-full rounded-lg bg-surface-2 animate-pulse" />
                ))}
                <div className="h-8 w-full rounded-lg bg-surface-2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History skeleton */}
      <div>
        <div className="h-6 w-40 rounded-lg bg-surface-2 animate-pulse mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-surface-2 animate-pulse" />
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
