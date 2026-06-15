import React from "react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  size?: "sm" | "md";
}

const styles = {
  primary: { background: "var(--color-accent)", color: "#0a0f1e", border: "none" },
  secondary: {
    background: "var(--color-surface-2)",
    color: "var(--color-text-muted)",
    border: "1px solid var(--color-border)",
  },
  danger: { background: "var(--color-error)", color: "white", border: "none" },
  ghost: { background: "transparent", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" },
};

export default function Button({
  variant = "primary",
  loading = false,
  size = "md",
  children,
  disabled,
  className = "",
  style: extra,
  ...props
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={`rounded-xl font-semibold transition-all ${size === "sm" ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm"} ${className}`}
      style={{
        ...styles[variant],
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.6 : 1,
        ...extra,
      }}
      {...props}
    >
      {loading ? "Loading…" : children}
    </button>
  );
}
