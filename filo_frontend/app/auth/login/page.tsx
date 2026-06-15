import AuthCard from "@/components/AuthCard";
import Form from "./_components/Form";
import Link from "next/link";

export default async function LoginPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  const redirect = searchParams?.redirect as string | undefined;

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your account">
      <Form redirectTo={redirect} />

      <p className="mt-3 text-center text-xs">
        <Link href="/admin/login" className="underline text-text-muted">
          Admin login
        </Link>
      </p>
    </AuthCard>
  );
}
