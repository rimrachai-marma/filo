"use client";

import React from "react";
import { Subscription, User } from "@/types";
import SidebarInner from "./SidebarInner";
import { useSidebar } from "./SidebarContext";

interface Props {
  user: User | null;
  subscription: Subscription | null;
}

export default function Sidebar({ user, subscription }: Props) {
  const { open, setOpen, isMobile } = useSidebar();

  return (
    <>
      {/* Desktop: inline collapsible rail */}
      <aside className="hidden md:block h-screen sticky top-0 shrink-0">
        <SidebarInner user={user} subscription={subscription} />
      </aside>

      {/* Mobile: offcanvas sheet */}
      {isMobile && open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative h-full w-64 shrink-0">
            <SidebarInner user={user} subscription={subscription} />
          </aside>
        </div>
      )}
    </>
  );
}
