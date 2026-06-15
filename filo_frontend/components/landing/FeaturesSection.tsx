import { BarChart2Icon, FileTextIcon, FoldersIcon, LockIcon, Share2Icon, ZapIcon } from "lucide-react";

const features = [
  {
    icon: LockIcon,
    iconClass: "text-sky-400",
    bgClass: "bg-sky-400/10",
    title: "Security in mind",
    desc: "We don't sell or share your data. E2E encryption is not currently offered.",
  },
  {
    icon: FoldersIcon,
    iconClass: "text-emerald-400",
    bgClass: "bg-emerald-400/10",
    title: "Deep folder nesting",
    desc: "Organize with nested folders up to 10 levels deep on Diamond plans.",
  },
  {
    icon: FileTextIcon,
    iconClass: "text-amber-400",
    bgClass: "bg-amber-400/10",
    title: "Multiple file types",
    desc: "Support for images, PDFs, videos, and audio — all in one place.",
  },
  {
    icon: Share2Icon,
    iconClass: "text-indigo-400",
    bgClass: "bg-indigo-400/10",
    title: "Easy sharing",
    desc: "Share files and folders with anyone using a secure link.",
  },
  {
    icon: ZapIcon,
    iconClass: "text-red-400",
    bgClass: "bg-red-400/10",
    title: "Lightning fast",
    desc: "Uploads and downloads optimized for low latency worldwide.",
  },
  {
    icon: BarChart2Icon,
    iconClass: "text-sky-400",
    bgClass: "bg-sky-400/10",
    title: "Storage insights",
    desc: "See exactly how your storage is used with a built-in dashboard.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="px-6 pb-24 max-w-4xl mx-auto">
      <p className="text-center text-xs font-semibold text-accent tracking-widest uppercase mb-2">Why Filo</p>
      <h2 className="text-center text-3xl font-display font-bold text-text mb-2">Everything you need</h2>
      <p className="text-center text-text-muted mb-10">Built for reliability, speed, and simplicity.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(({ icon: Icon, iconClass, bgClass, title, desc }) => (
          <div key={title} className="flex gap-4 items-start bg-surface border border-border rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgClass}`}>
              <Icon className={`size-5 ${iconClass}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text mb-1">{title}</h3>
              <p className="text-[13px] text-text-muted leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
