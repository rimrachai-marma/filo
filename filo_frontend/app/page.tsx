import Link from "next/link";
import { ArrowRight, FolderOpen } from "lucide-react";
import HeroSection from "@/components/landing/HeroSection";
import PerksBarSection from "@/components/landing/PerksBarSection";
import PricingSection from "@/components/landing/PricingSection";
import FeaturesSection from "@/components/landing/FeaturesSection";

export default function Home() {
  return (
    <>
      <main className="min-h-screen bg-background text-text font-body">
        {/* ── NAV ── */}
        <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="bg-sky-400/10 w-8 h-8 rounded-lg flex items-center justify-center">
              <FolderOpen className="size-4 text-sky-400" />
            </div>
            <span className="font-bold text-lg tracking-tight font-display text-slate-200">Filo</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm px-4 py-2 rounded-lg transition-colors text-slate-500 hover:text-slate-200"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm text-[#0a0f1e] bg-sky-400 hover:bg-sky-300 px-4 py-2 rounded-lg font-medium flex items-center gap-1.5 transition-all"
            >
              Sign up <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </nav>

        <HeroSection />

        <PerksBarSection />

        <PricingSection />

        <FeaturesSection />
      </main>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-text-muted">
        &copy; {new Date().getFullYear()} Filo · Secure file storage for everyone
      </footer>
    </>
  );
}
