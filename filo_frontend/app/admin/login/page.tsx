import AuthCard from "@/components/AuthCard";
import { ShieldIcon } from "lucide-react";
import Form from "./_components/Form";

export default async function AdminLoginPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  const redirect = searchParams?.redirect as string | undefined;

  return (
    <AuthCard
      title="Admin Login"
      subtitle="Restricted — administrators only"
      accentColor="#fbbf24"
      icon={<ShieldIcon className="size-5 text-warning" />}
    >
      <Form redirectTo={redirect} />

      <p className="mt-4 text-center text-xs text-text-muted">Default: admin@filo.com / admin#123</p>
    </AuthCard>
  );
}
