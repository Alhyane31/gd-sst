import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import SidebarMenu from "@/app/SidebarMenu";
import ReferentielAesPage from "./ReferentielAesPage";

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <SidebarMenu userName={session.user?.name ?? ""} userSurname={session.user?.surname ?? ""}>
      <ReferentielAesPage />
    </SidebarMenu>
  );
}
