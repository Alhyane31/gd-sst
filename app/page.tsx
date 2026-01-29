import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import SidebarMenu from "./SidebarMenu"
import {Badge,  Button, Box, Typography, Paper } from "@mui/material" 

import CalendarWithTags from "./components/BigCalendar";
const events = [
  { date: "2026-01-05", title: "RDV 24" },
  { date: "2026-01-07", title: "RDV 3" },
  { date: "2026-01-12", title: "RDV 10" },
];



export default async function HomePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  return (
   
    <SidebarMenu
  userName={session.user?.name || session.user?.email || "Nom"}
  userSurname={session.user?.surname || ""}
>
  <Box display="flex" gap={4} p={4} bgcolor="#e0e0e0">
  {/* Premier Box */}
  <Paper sx={{ p: 4, flex: 1 }} elevation={3}>
    <Typography variant="h4" mb={2}>Dashboard</Typography>
    <Typography mb={2}>Bienvenue, {session.user?.name || session.user?.email}!</Typography>

    <Typography variant="body2" mb={2}>Session complète:</Typography>
    <pre>{JSON.stringify(session, null, 2)}</pre>
  </Paper>

  {/* Deuxième Box */}
  <Paper sx={{ p: 4, flex: 1 }} elevation={3}>
    <CalendarWithTags events={events} />
  </Paper>
</Box>
</SidebarMenu>
  )
}
