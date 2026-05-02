import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SidebarMenu from "@/app/SidebarMenu";
import { Box, Paper, Typography } from "@mui/material";
import BigCalendar from "@/app/components/BigCalendar";

export default async function CalendrierPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <SidebarMenu
      userName={session.user?.name || session.user?.email || "Nom"}
      userSurname={session.user?.surname || ""}
    >
      <Box p={2}>
        <Typography variant="h5" fontWeight={700} mb={3}>
          Calendrier des convocations
        </Typography>
        <Paper elevation={3} sx={{ p: 3 }}>
          <BigCalendar />
        </Paper>
      </Box>
    </SidebarMenu>
  );
}
