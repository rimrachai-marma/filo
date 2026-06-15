"use server";

import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/Sidebar/SidebarContext";
import { UploadProvider } from "@/lib/context/UploadContext";
import { get } from "@/lib/api.server";
import { Subscription, User } from "@/types";
import { UploadDrawer } from "@/components/upload/UploadDrawer";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const res = await get<{ user: User; subscription: Subscription | null }>({ path: "/auth/me" });

  if (res.status === "error") throw new Error(res.message);

  return (
    <SidebarProvider>
      <UploadProvider>
        <div className="flex min-h-screen bg-background">
          <Sidebar user={res.data.user} subscription={res.data.subscription} />
          <main className="flex-1">
            {children}

            <footer className="border-t border-border bor px-6 py-8 text-center text-sm text-text-muted">
              &copy; {new Date().getFullYear()} Filo · Secure file storage for everyone
            </footer>
          </main>
        </div>
        {/* Floating upload progress drawer — renders on top of everything */}
        <UploadDrawer />
      </UploadProvider>
    </SidebarProvider>
  );
}
