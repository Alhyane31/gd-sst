import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SidebarMenu from "../SidebarMenu";
import RecherchePersonnelPage from "./bordereauxSearchPage";

export default async function PersonnelPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
if (session.user.role == "") redirect("/403")
  return (
    <SidebarMenu
      userName={session.user?.name || session.user?.email || "Nom"}
      userSurname={session.user?.surname || ""}
    >
      <RecherchePersonnelPage />
    </SidebarMenu>
  );
}
