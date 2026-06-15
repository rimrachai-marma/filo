import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import React from "react";
import { userLogout, userLogoutAllDevices } from "@/lib/actions/auth";
import { BarChart2Icon, CreditCard, FolderIcon, LinkIcon } from "lucide-react";
import Link from "next/link";
import { ResumePickerTrigger } from "../upload/ResumePicker/ResumePicker";
import { Subscription, User } from "@/types";

interface Props {
  user: User | null;
  subscription: Subscription | null;
}

const SidebarInner: React.FC<Props> = ({ user, subscription }) => {
  const pathname = usePathname();
  const { state, setOpen, isMobile } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";

  const [, action, pending] = React.useActionState(userLogout, null);
  const [, logoutAllDevicesAction, logoutAllDevicesPending] = React.useActionState(userLogoutAllDevices, null);

  const handleLogout = () => React.startTransition(() => action());
  const handleLogoutAllDevices = () => React.startTransition(() => logoutAllDevicesAction());

  const navItems = [
    { href: "/dashboard", label: "Files", icon: <FolderIcon className="size-4 shrink-0" /> },
    { href: "/dashboard/storage", label: "Storage", icon: <BarChart2Icon className="size-4 shrink-0" /> },
    { href: "/dashboard/shares", label: "Shares", icon: <LinkIcon className="size-4 shrink-0" /> },
    { href: "/dashboard/subscription", label: "Subscription", icon: <CreditCard className="size-4 shrink-0" /> },
  ];

  return (
    <div
      className={`flex flex-col h-full bg-surface border-r border-border transition-[width] duration-200 overflow-hidden ${
        collapsed ? "w-14" : "w-64"
      }`}
    >
      {/* Logo */}

      <div className="h-16 flex items-center border-b border-border shrink-0 px-3">
        <Link href="/">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-[rgba(56,189,248,0.3)] shrink-0">
            <FolderIcon className="size-3.5 text-accent" />
          </div>
        </Link>
        {!collapsed && <span className="ml-2.5 font-display font-bold text-sm text-text whitespace-nowrap">Filo</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {!collapsed && <p className="text-xs font-medium px-2 mb-2 uppercase tracking-wider text-text-muted">Menu</p>}

        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setOpen(false)}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-2 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all border ${
                active
                  ? "bg-accent-dim text-accent border-sky-400/20"
                  : "bg-transparent text-text-muted border-transparent hover:bg-surface-2"
              } ${collapsed ? "justify-center" : ""}`}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className={`border-t border-border shrink-0 ${collapsed ? "p-2" : "p-4"}`}>
        {!collapsed && (
          <>
            <div className="mb-3">
              <ResumePickerTrigger />
            </div>

            {subscription ? (
              <div className="px-3 py-2 rounded-xl mb-3 bg-surface-2 border border-border">
                <div className="text-xs text-text-muted">Active Plan</div>
                <div
                  style={{ "--tc": subscription.package.tierColor } as React.CSSProperties}
                  className="font-semibold text-sm mt-0.5 text-(--tc)"
                >
                  {subscription.package.displayName}
                </div>
              </div>
            ) : (
              <div className="px-3 py-2 rounded-xl mb-3 bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.15)]">
                <div className="text-xs mb-0.5 text-error">No active plan</div>
                <Link href="/dashboard/subscription" className="text-xs font-semibold text-error">
                  Select a plan →
                </Link>
              </div>
            )}
          </>
        )}

        <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : "mb-3"}`}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-accent-dim text-accent"
            title={collapsed ? user?.name : undefined}
          >
            {user?.name.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-text">{user?.name}</p>
              <p className="text-xs truncate text-text-muted">{user?.email}</p>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="space-y-1">
            <button
              onClick={handleLogout}
              disabled={pending}
              className="w-full py-2 rounded-xl text-xs font-medium bg-surface-2 border border-border text-text-muted hover:bg-surface-3 transition cursor-pointer"
            >
              {pending ? "Logging out..." : "Logout"}
            </button>
            <button
              onClick={handleLogoutAllDevices}
              disabled={logoutAllDevicesPending}
              className="w-full py-2 rounded-xl text-xs font-medium bg-surface-2 border border-border text-text-muted hover:bg-surface-3 transition cursor-pointer"
            >
              {logoutAllDevicesPending ? "Logging out..." : "Logout All Devices"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarInner;
