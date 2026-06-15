"use client";

import { AuthModal } from "@/components/AuthModal";
import LoginForm from "@/app/auth/login/_components/Form";

export default function LoginModal() {
  return (
    <AuthModal type="login">
      <LoginForm />
    </AuthModal>
  );
}
