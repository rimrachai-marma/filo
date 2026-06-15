import { AuthModal } from "@/components/AuthModal";
import SignupForm from "@/app/auth/signup/_components/Form";

export default function SignupModal() {
  return (
    <AuthModal type="signup">
      <SignupForm />
    </AuthModal>
  );
}
