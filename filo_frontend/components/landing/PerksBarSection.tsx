import { Shield, Star, Zap } from "lucide-react";

const perks = [
  { icon: Shield, label: "Secure", sub: " Your data is never shared with third parties." },
  { icon: Zap, label: "Instant uploads", sub: "No waiting, no queues." },
  { icon: Star, label: "Upgrade anytime", sub: "Scale as you grow." },
];

const PerksBarSection = () => {
  return (
    <section className="mx-auto max-w-3xl mb-16 px-6">
      <div className="bg-[#111827] border border-white/6 rounded-2xl flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-white/6">
        {perks.map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex items-center gap-3 px-7 py-5 flex-1">
            <div className="bg-sky-400/10 w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
              <Icon className="size-4 text-sky-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-200">{label}</div>
              <div className="text-xs mt-0.5 text-slate-500">{sub}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PerksBarSection;
