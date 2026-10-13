"use client";

// Clôture du dossier AES : possible après la visite S12, ou après un arrêt justifié du suivi (motif).
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import { useState } from "react";
import { suivisPourRegles } from "@/lib/aes/contexte";
import { peutCloturer } from "@/lib/aes/suivi";
import type { DeclarationApi } from "../types";

export default function ClotureAes({
  visiteId,
  declaration,
  onClosed,
}: {
  visiteId: string;
  declaration: DeclarationApi | null;
  onClosed: (d: DeclarationApi) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const [erreur, setErreur] = useState("");

  if (!declaration || declaration.statut !== "VALIDEE") return null;

  const verif = peutCloturer(
    suivisPourRegles(declaration),
    declaration.consultations.map((c) => ({ visite: c.visite, conduite: c.data?.conduite })),
    motif || declaration.motifArretSuivi
  );

  const cloturer = async () => {
    setErreur("");
    const res = await fetch(`/api/aes/${visiteId}/cloture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motifArretSuivi: motif }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) return setErreur(payload?.message ?? "Clôture impossible");
    setOuvert(false);
    onClosed(payload.declaration);
  };

  return (
    <>
      <Button variant="contained" color="success" startIcon={<LockIcon />} onClick={() => setOuvert(true)}>
        Clôturer le dossier AES
      </Button>
      <Dialog open={ouvert} onClose={() => setOuvert(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Clôturer le dossier AES</DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={2}>
            La clôture est possible après la visite S12, ou après un arrêt justifié du suivi (consultation avec « Fin du suivi » ou
            « Arrêt du TPE (source négative) ») : dans ce cas, indiquez le motif. La visite sera également clôturée.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Motif de l'arrêt du suivi (si avant S12)"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
          />
          {!verif.ok && verif.raison && <Alert severity="warning" sx={{ mt: 2 }}>{verif.raison}</Alert>}
          {erreur && <Alert severity="error" sx={{ mt: 2 }}>{erreur}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOuvert(false)}>Annuler</Button>
          <Button variant="contained" color="success" disabled={!verif.ok} onClick={cloturer}>
            Clôturer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
