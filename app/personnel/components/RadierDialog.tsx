"use client";

import {
  Alert, Button, Dialog, DialogActions, DialogContent,
  DialogTitle, Stack, TextField, Typography,
} from "@mui/material";
import { useState } from "react";

type Personnel = { id: string; firstName: string; lastName: string };
type Props     = { open: boolean; onClose: () => void; onSuccess: () => void; personnel: Personnel | null };

export default function RadierDialog({ open, onClose, onSuccess, personnel }: Props) {
  const [dateSortie, setDateSortie] = useState("");
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  const handleRadier = async () => {
    setError("");
    if (!dateSortie) { setError("La date de sortie est obligatoire"); return; }
    if (!personnel)  return;
    setSaving(true);
    try {
      const res = await fetch("/api/personnel/radier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personnelIds: [personnel.id], dateSortie }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      setDateSortie("");
      onSuccess();
      onClose();
    } catch {
      setError("Erreur serveur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Radier le personnel</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {personnel && (
            <Typography variant="body1">
              Vous allez radier <strong>{personnel.lastName} {personnel.firstName}</strong>.
              Cette action rendra le dossier inactif.
            </Typography>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Date de sortie *"
            type="date"
            size="small"
            fullWidth
            value={dateSortie}
            onChange={(e) => setDateSortie(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" color="error" onClick={handleRadier} disabled={saving}>
          {saving ? "Radiation..." : "Radier"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
