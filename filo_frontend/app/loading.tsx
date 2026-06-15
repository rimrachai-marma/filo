export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div
            className="absolute inset-0 rounded-full border-3 border-surface-2"
            style={{
              borderTopColor: "var(--color-accent)",
              animation: "spin 1s linear infinite",
            }}
          />
        </div>

        <p className="text-sm text-text-muted">Loading...</p>
      </div>
    </div>
  );
}
