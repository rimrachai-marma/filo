import AuthCard from "@/components/AuthCard";
import Form from "./_components/Form";

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset Password" subtitle="We'll send a link to your inbox">
      <Form />
    </AuthCard>
  );
}
