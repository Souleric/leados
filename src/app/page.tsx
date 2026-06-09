import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";

export default async function Home() {
  const user = await getAuthUser();
  if (user?.is_master_admin) redirect("/master");
  redirect("/dashboard");
}
