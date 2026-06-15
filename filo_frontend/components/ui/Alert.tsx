import { XIcon } from "lucide-react";

interface Props {
  type: "error" | "success" | "info";
  children: React.ReactNode;
  onClose?: () => void;
}

const colors = {
  error: { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.2)", color: "var(--color-error)" },
  success: { bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.2)", color: "var(--color-success)" },
  info: { bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.2)", color: "var(--color-accent)" },
};

export default function Alert({ type, children, onClose }: Props) {
  const c = colors[type];

  return (
    <div
      className="p-4 rounded-xl text-sm flex items-start justify-between gap-3 animate-fade-in"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
    >
      <span className="leading-snug">{children}</span>
      {onClose && (
        <button onClick={onClose} className="bg-none border-none cursor-pointer shrink-0 text-sm leading-1">
          <XIcon className="size-4" />
        </button>
      )}
    </div>
  );
}
