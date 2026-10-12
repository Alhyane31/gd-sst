"use client";

import { Alert, Stack } from "@mui/material";
import type { Alerte } from "@/lib/clinique/mesures";

export default function AlertList({ alertes }: { alertes: Alerte[] }) {
  if (alertes.length === 0) return null;
  return (
    <Stack spacing={1}>
      {alertes.map((a, i) => (
        <Alert key={i} severity={a.severite} variant={a.severite === "error" ? "filled" : "standard"}>
          {a.message}
        </Alert>
      ))}
    </Stack>
  );
}
