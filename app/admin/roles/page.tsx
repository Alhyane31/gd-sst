import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import SidebarMenu from "@/app/SidebarMenu";
import RolesPage from "./RolesPage";

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <SidebarMenu userName={session.user?.name ?? ""} userSurname={session.user?.surname ?? ""}>
      <RolesPage />
    </SidebarMenu>
  );
}
