import { RoleAuth } from "@/components/features/role-auth";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <RoleAuth role="teacher" mode="login" callbackFailed={Boolean(error)} />;
}
