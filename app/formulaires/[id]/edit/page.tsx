// app/formulaires/nouveau/page.tsx

import VisiteEditPage from "./formedit";
import { Box, Container } from "@mui/material";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SidebarMenu from "../../../SidebarMenu";

export default async function NouveauFormulairePage() {
      const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
if (session.user.role == "") redirect("/403")
  return (
   
   <SidebarMenu
      userName={session.user?.name || session.user?.email || "Nom"}
      userSurname={session.user?.surname || ""}
    >
   <Container maxWidth="lg">
      <Box py={4}>
        <VisiteEditPage />
      </Box>
    </Container></SidebarMenu>
  );
}




