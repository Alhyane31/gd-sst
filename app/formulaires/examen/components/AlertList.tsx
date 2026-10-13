"use client";

import { Alert, Button, Stack } from "@mui/material";
import type { Alerte } from "@/lib/clinique/mesures";

export default function AlertList({
  alertes,
  onApply,
}: {
  alertes: Alerte[];
  /** applique les valeurs d'une suggestion (absent : lecture seule, pas de bouton) */
  onApply?: (valeurs: Record<string, unknown>) => void;
}) {
  if (alertes.length === 0) return null;
  return (
    <Stack spacing={1}>
      {alertes.map((a, i) => (
        <Alert
          key={i}
          severity={a.severite}
          variant={a.severite === "error" ? "filled" : "standard"}
          action={
            a.appliquer && onApply ? (
              <Button color="inherit" size="small" onClick={() => onApply(a.appliquer!.valeurs)}>
                {a.appliquer.libelle}
              </Button>
            ) : undefined
          }
        >
          {a.message}
        </Alert>
      ))}
    </Stack>
  );
}
