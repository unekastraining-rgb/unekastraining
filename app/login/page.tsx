import { LoginPageClient } from "./login-client";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <LoginPageClient error={params.error ?? null} next={params.next ?? null} />
  );
}
