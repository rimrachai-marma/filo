import { FolderIcon } from "lucide-react";
import Link from "next/link";

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accentColor?: string;
  icon?: React.ReactNode;
}

export default function AuthCard({ title, subtitle, children, accentColor = "var(--color-accent)", icon }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <Link className="inline-flex items-center gap-2 mb-5" href="/">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}40` }}
            >
              {icon || <FolderIcon className="size-5 text-accent" />}
            </div>

            <span className="font-display font-bold text-lg text-text">Filo</span>
          </Link>
          <h1 className="text-3xl font-display font-bold text-text">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-text-muted">{subtitle}</p>}
        </div>
        <div className="rounded-2xl p-8 bg-surface" style={{ border: `1px solid ${accentColor}20` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
