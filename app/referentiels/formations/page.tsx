import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import SidebarMenu from "@/app/SidebarMenu";
import FormationsPage from "./FormationsPage";

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <SidebarMenu userName={session.user?.name ?? ""} userSurname={session.user?.surname ?? ""}>
      <FormationsPage />
    </SidebarMenu>
  );
}
