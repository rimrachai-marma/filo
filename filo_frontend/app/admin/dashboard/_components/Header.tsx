"use client";

import React from "react";

import Button from "@/components/ui/Button";
import { ShieldIcon } from "lucide-react";
import { adminLogout, adminLogoutAllDevices } from "@/lib/actions/auth";

export function Header() {
  const [, action, pending] = React.useActionState(adminLogout, null);
  const [, logoutAllDevicesAction, logoutAllDevicesPending] = React.useActionState(adminLogoutAllDevices, null);

  const handleLogout = async () => {
    React.startTransition(() => {
      action();
    });
  };

  const handleLogoutAllDevices = async () => {
    React.startTransition(() => {
      logoutAllDevicesAction();
    });
  };

  return (
    <header className="sticky top-0 z-40 px-6 py-4 bg-[rgba(10,15,30,0.92)] backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgba(241,245,249,0.1)] border border-[rgba(241,245,249,0.3)]">
            <ShieldIcon size={16} color="#fbbf24" />
          </div>
          <span className="font-display font-bold text-text">Admin Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleLogout} disabled={pending} variant="secondary" size="sm">
            {pending ? "Logging out..." : "Logout"}
          </Button>
          <Button onClick={handleLogoutAllDevices} disabled={logoutAllDevicesPending} variant="secondary" size="sm">
            {logoutAllDevicesPending ? "Logging out..." : "Logout All Devices"}
          </Button>
        </div>
      </div>
    </header>
  );
}
