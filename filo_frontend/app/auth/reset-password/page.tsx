import ResetPassword from "./_components/ResetPassword";

export default async function ResetPasswordPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const token = searchParams?.token as string | undefined;

  return <ResetPassword token={token} />;
}
