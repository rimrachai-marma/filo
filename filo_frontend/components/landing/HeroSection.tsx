import { ArrowRight } from "lucide-react";
import Link from "next/link";

const HeroSection = () => {
  return (
    <section className="pt-36 pb-20 px-6 text-center">
      <div className="bg-sky-400/8 inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-sky-400/20 text-sky-400">
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        Secure cloud file storage
      </div>

      <h1 className="text-5xl sm:text-6xl font-bold mb-5 leading-[1.1] tracking-tight font-display text-slate-200">
        Your files,
        <br />
        <span className="text-sky-400">always within reach.</span>
      </h1>
      <p className="text-base max-w-lg mx-auto mb-10 text-slate-500">
        Filo gives you fast, encrypted storage with the folder structure you actually want. Pick a plan and start
        organizing today.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/auth/signup"
          className="bg-sky-400 text-[#0a0f1e] hover:bg-sky-300 w-full sm:w-auto px-7 py-3 rounded-lg font-medium inline-flex items-center justify-center gap-2 transition-all"
        >
          Get started free <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/auth/login"
          className="bg-[#111827] text-slate-200 w-full sm:w-auto px-7 py-3 rounded-lg font-medium inline-flex items-center justify-center gap-2 border border-white/8 hhover:border-white/15 transition-colors"
        >
          Log in
        </Link>
      </div>
    </section>
  );
};

export default HeroSection;
