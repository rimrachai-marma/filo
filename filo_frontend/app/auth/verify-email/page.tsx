import VerifyEmail from "./_components/VerifyEmail";

export default async function VerifyEmailPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  const token = searchParams?.token as string | undefined;

  return <VerifyEmail token={token} />;
}
