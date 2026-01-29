"use client"

import { useState } from "react"
import { Box, Button, TextField, Typography, Paper } from "@mui/material"
import { signIn } from "next-auth/react"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = async () => {
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (res?.error) setError("Identifiants invalides")
    else window.location.href = "."
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f5f5f5"
    >
      <Paper elevation={3} sx={{ p: 4, width: 350, textAlign: "center" }}>
        {/* Logos */}
        <Box display="flex" justifyContent="center" gap={1} mb={3}>
          <Image src="/images/image1.jpg" alt="Logo 1" width={900} height={100} style={{ objectFit: "contain" }}/>
        
        </Box>

        <Typography variant="h5" mb={3}>
          Connexion
        </Typography>

        {/* Inputs */}
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Mot de passe"
          variant="outlined"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleLogin}
        >
          Se connecter
        </Button>

        {error && (
          <Typography color="error" mt={2}>
            {error}
          </Typography>
        )}
      </Paper>
    </Box>
  )
}
