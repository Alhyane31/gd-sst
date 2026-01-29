"use client"

import { Button } from "@mui/material"
import { signOut } from "next-auth/react"

export default function LogoutButton() {
  return (
    <Button variant="contained" color="secondary" onClick={() => signOut({ callbackUrl: "/login" })}>
      Déconnexion
    </Button>
  )
}
