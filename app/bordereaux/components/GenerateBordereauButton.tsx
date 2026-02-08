"use client";

import { Button } from "@mui/material";
import { useState } from "react";

export default function GenerateBordereauButton({
  bordereauId,
  disabled,
  onGenerated,
}: {
  bordereauId: string;
  disabled: boolean;
  onGenerated: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (disabled) return;
    if (!confirm("Générer ce bordereau ?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/bordereaux/${bordereauId}/generate`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Erreur génération");
        return;
      }
      onGenerated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="contained" color="success" onClick={handle} disabled={disabled || loading}>
      {loading ? "Génération..." : "Générer bordereau"}
    </Button>
  );
}
