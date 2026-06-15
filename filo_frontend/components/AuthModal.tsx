"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Modal from "./ui/Modal";

interface Props {
  type: "login" | "signup";
  children: React.ReactNode;
}

export function AuthModal({ type, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const modalRef = React.useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    modalRef.current?.showModal();
  });

  useEffect(() => {
    if (!(pathname === "/auth/login" || pathname === "/auth/signup")) {
      modalRef.current?.close();
    }
  }, [pathname]);

  const handleClose = () => {
    if (pathname === "/auth/login" || pathname === "/auth/signup") {
      router.back();
    }
  };

  return (
    <Modal
      ref={modalRef}
      modalRef={modalRef}
      title={type === "login" ? "Welcome Back" : "Create Account"}
      subtitle={type === "login" ? "Sign in to your account" : "Join Filo today"}
      onClose={handleClose}
    >
      {children}
    </Modal>
  );
}
