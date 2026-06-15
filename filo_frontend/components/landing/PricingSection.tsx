import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    tierColor: "#64748b",
    description: "Get started with the basics.",
    badge: null,
    features: [
      "500 MB storage",
      "Up to 5 folders",
      "2 nesting levels",
      "20 files total · 5 per folder",
      "Images & PDFs",
      "5 MB max file size",
    ],
    cta: "Start for free",
    href: "/auth/signup",
    ghost: true,
  },
  {
    name: "Silver",
    price: "$5",
    period: "per month",
    tierColor: "#94a3b8",
    description: "More space, more flexibility.",
    badge: null,
    features: [
      "2 GB storage",
      "Up to 20 folders",
      "3 nesting levels",
      "100 files total · 20 per folder",
      "Images, Video, PDF & Audio",
      "25 MB max file size",
    ],
    cta: "Get Silver",
    href: "/auth/signup?plan=silver",
    ghost: false,
  },
  {
    name: "Gold",
    price: "$12",
    period: "per month",
    tierColor: "#fbbf24",
    description: "Built for power users.",
    badge: "Most popular",
    features: [
      "5 GB storage",
      "Up to 50 folders",
      "5 nesting levels",
      "500 files total · 50 per folder",
      "Images, Video, PDF & Audio",
      "100 MB max file size",
    ],
    cta: "Get Gold",
    href: "/auth/signup?plan=gold",
    ghost: false,
  },
  {
    name: "Diamond",
    price: "$25",
    period: "per month",
    tierColor: "#818cf8",
    description: "Maximum power, no compromises.",
    badge: "Best value",
    features: [
      "10 GB storage",
      "Up to 200 folders",
      "10 nesting levels",
      "5,000 files total · 200 per folder",
      "Images, Video, PDF & Audio",
      "500 MB max file size",
    ],
    cta: "Get Diamond",
    href: "/auth/signup?plan=diamond",
    ghost: false,
  },
];

const PricingSection = () => {
  return (
    <section className="px-6 pb-24">
      <div className="text-center mb-12">
        <p className="text-center text-xs font-semibold text-accent tracking-widest uppercase mb-2">Pricing</p>
        <h2 className="text-center text-3xl font-display font-bold text-text mb-2">Plans for every need</h2>
        <p className="text-center text-text-muted mb-10">Start free, scale as you grow.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#111827] border-[1.5px] border-[color-mix(in_srgb,var(--tc)_25%,transparent)] transition-all duration-300 hover:border-[color-mix(in_srgb,var(--tc)_55%,transparent)] hover:shadow-[0_0_32px_-8px_color-mix(in_srgb,var(--tc)_35%,transparent)]"
            style={{ "--tc": plan.tierColor } as React.CSSProperties}
          >
            {/* badge */}
            {plan.badge && (
              <div className="absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full text-(--tc) bg-[color-mix(in_srgb,var(--tc)_13%,transparent)] border border-[color-mix(in_srgb,var(--tc)_27%,transparent)]">
                {plan.badge}
              </div>
            )}

            <div className="p-6 flex-1 flex flex-col">
              {/* tier dot + name */}
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-(--tc) shadow-[0_0_8px_var(--tc)]" />
                <span
                  className="text-sm font-semibold tracking-wide uppercase text-(--tc)"
                  style={{ letterSpacing: "0.06em" }}
                >
                  {plan.name}
                </span>
              </div>

              {/* price */}
              <div className="mb-1">
                <span className="text-4xl font-bold tracking-tight font-display text-slate-200">{plan.price}</span>
                <span className="text-sm ml-1 text-slate-500">/{plan.period}</span>
              </div>

              <p className="text-xs mb-6 text-slate-500">{plan.description}</p>

              {/* features */}
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="size-3.5 shrink-0 mt-0.5 text-(--tc)" />
                    <span className="text-xs leading-relaxed text-slate-400">{f}</span>
                  </li>
                ))}
              </ul>

              {/* cta */}
              {plan.ghost ? (
                <Link
                  href={plan.href}
                  className="block text-center text-sm font-medium py-2.5 rounded-xl transition-all bg-transparent border border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
                >
                  {plan.cta}
                </Link>
              ) : (
                <Link
                  href={plan.href}
                  className="block text-center text-sm font-medium py-2.5 rounded-xl transition-all border border-transparent text-[#0a0f1e] bg-(--tc) hover:opacity-85"
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PricingSection;
