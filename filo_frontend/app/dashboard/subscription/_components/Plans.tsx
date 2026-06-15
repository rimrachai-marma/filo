"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { formatData } from "@/lib/utils";
import { FileType, Package, Subscription } from "@/types";
import { switchPlan } from "@/lib/actions/subscriptions";
import { FileIcon, ImageIcon, MusicIcon, VideoIcon } from "lucide-react";
import Alert from "@/components/ui/Alert";

const TYPE_ICONS: Record<FileType, React.ReactNode> = {
  IMAGE: <ImageIcon size={14} />,
  VIDEO: <VideoIcon size={14} />,
  PDF: <FileIcon size={14} />,
  AUDIO: <MusicIcon size={14} />,
};

interface Props {
  packages: Package[];
  subscriptions: Subscription[];
}

const Plans: React.FC<Props> = ({ packages, subscriptions }) => {
  const router = useRouter();

  const active = subscriptions.find((sub) => sub.isActive);

  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const [state, formAction, isPending] = React.useActionState(switchPlan, null);

  const handleSelect = (packageId: string) => {
    setPendingId(packageId);

    React.startTransition(() => {
      formAction(packageId);
    });
  };

  React.useEffect(() => {
    if (state?.status === "success") {
      router.refresh();
    }
  }, [state?.status, router]);

  return (
    <>
      {!isPending && state?.status === "error" && (
        <div className="mb-2.5">
          <Alert type="error">{state?.message}</Alert>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        {packages.map((pkg) => {
          const isActive = pkg.id === active?.package.id;

          const isCompleted = state?.status === "success" || state?.status === "error";

          const isSwitching = !isCompleted && isPending && pendingId === pkg.id;

          return (
            <div
              key={pkg.id}
              className={`rounded-2xl p-5 flex flex-col relative border ${
                isActive
                  ? "border-[color-mix(in_srgb,var(--tc)_35%,transparent)] bg-[color-mix(in_srgb,var(--tc)_8%,transparent)]"
                  : "border-border bg-color-surface"
              }`}
              style={
                {
                  "--tc": pkg.tierColor,
                } as React.CSSProperties
              }
            >
              {isActive && (
                <span
                  className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-medium border border-[color-mix(in_srgb,var(--tc)_35%,transparent)] bg-[color-mix(in_srgb,var(--tc)_8%,transparent)]"
                  style={
                    {
                      "--tc": pkg.tierColor,
                    } as React.CSSProperties
                  }
                >
                  Active
                </span>
              )}

              <div className="mb-3">
                <div className="text-xs font-mono font-semibold mb-0.5 text-(--tc)">{pkg.name}</div>

                <h3 className="text-xl font-display font-bold text-text">{pkg.displayName}</h3>
              </div>

              <div className="space-y-1.5 flex-1 text-xs">
                {(
                  [
                    ["Max Folders", pkg.maxFolders],
                    ["Nesting Levels", pkg.maxNestingLevel],
                    ["Max File", formatData(BigInt(pkg.maxFileSizeBytes))],
                    ["Storage Limit", formatData(BigInt(pkg.storageLimitBytes))],
                    ["Total Files", pkg.totalFileLimit],
                    ["Files Per Folder", pkg.filesPerFolder],
                  ] as [string, string | number][]
                ).map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-text-muted">{label}</span>
                    <span className="text-text">{value}</span>
                  </div>
                ))}

                <div className="flex gap-1 pt-1 flex-wrap">
                  {pkg.allowedFileTypes.map((type) => (
                    <span key={type} title={type} style={{ color: pkg.tierColor }} className="mr-2">
                      {TYPE_ICONS[type as FileType]}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleSelect(pkg.id)}
                disabled={isActive || isPending}
                className="mt-4 w-full py-2 rounded-xl text-xs font-semibold border"
                style={{
                  color: isActive ? "var(--tc)" : "#0a0f1e",
                  backgroundColor: isActive ? "color-mix(in srgb, var(--tc) 8%, transparent)" : pkg.tierColor,
                  borderColor: "color-mix(in srgb, var(--tc) 35%, transparent)",
                  cursor: isActive ? "default" : isPending ? "not-allowed" : "pointer",
                  opacity: isSwitching ? 0.6 : 1,
                }}
              >
                {isSwitching ? "..." : isActive ? "✓ Current" : "Select"}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Plans;
