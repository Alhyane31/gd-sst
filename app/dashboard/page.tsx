import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Button, Box, Typography, Paper } from "@mui/material"
import { signOut } from "next-auth/react"
import LogoutButton from "../login/LogoutButton"


export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.role == "") redirect("/403")


  return (
    <Box minHeight="100vh" bgcolor="#e0e0e0" p={4}>
      <Paper sx={{ p: 4, maxWidth: 600, margin: "0 auto" }} elevation={3}>
        <Typography variant="h4" mb={2}>
          Dashboard
        </Typography>
        <Typography mb={2}>Bienvenue, {session.user?.name || session.user?.email}!</Typography>

        <Typography variant="body2" mb={2}>
          Session complète:
        </Typography>
        <pre>{JSON.stringify(session, null, 2)}</pre>

        <LogoutButton />
      </Paper>
    </Box>
  )
}

