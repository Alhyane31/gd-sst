"use client";

import { Button, CircularProgress } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useState } from "react";

export default function DeleteBordereauButton({
  bordereauId,
  disabled,
  onDeleted,
}: {
  bordereauId: string;
  disabled?: boolean;
  onDeleted?: () => Promise<void> | void;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!bordereauId || disabled || loading) return;

    const ok = window.confirm(
      "Supprimer ce bordereau ?\n\n" +
        "• Possible uniquement si le statut est NOUVEAU\n" +
        "• Les convocations seront détachées automatiquement\n\n" +
        "Cette action est irréversible."
    );
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/bordereaux/${bordereauId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.error ?? "Erreur lors de la suppression du bordereau");
        return;
      }

      await onDeleted?.();
    } catch (e) {
      console.error("Delete bordereau error", e);
      alert("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outlined"
      color="error"
      onClick={handleDelete}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} /> : <DeleteOutlineIcon />}
    >
      {loading ? "Suppression..." : "Supprimer bordereau"}
    </Button>
  );
}
