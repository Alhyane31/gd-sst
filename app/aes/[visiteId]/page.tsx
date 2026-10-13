import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SidebarMenu from "../../SidebarMenu";
import AesDossierPage from "./AesDossierPage";

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <SidebarMenu
      userName={session.user?.name || session.user?.email || "Nom"}
      userSurname={session.user?.surname || ""}
    >
      <AesDossierPage />
    </SidebarMenu>
  );
}
