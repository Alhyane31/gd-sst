import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SidebarMenu from "./SidebarMenu";
import DashboardPage from "./dashboard/DashboardPage";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <SidebarMenu
      userName={session.user?.name || session.user?.email || "Nom"}
      userSurname={session.user?.surname || ""}
    >
      <DashboardPage />
    </SidebarMenu>
  );
}
