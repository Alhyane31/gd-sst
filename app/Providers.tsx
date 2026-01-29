"use client"

import { ThemeProvider, createTheme, CssBaseline } from "@mui/material"
import { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  const theme = createTheme({
    palette: {
      mode: "light", // "light" ou "dark"
      primary: { main: "#1976d2" },
      secondary: { main: "#9c27b0" },
    },
    typography: {
      fontFamily: "Arial, Helvetica, sans-serif",
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
