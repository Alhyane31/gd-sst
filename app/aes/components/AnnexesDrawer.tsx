"use client";

// Panneau latéral des annexes AES (A à G), consultable pendant la saisie sans quitter le formulaire.
import { Box, Chip, Drawer, IconButton, Stack, Tab, Tabs, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { ReferentielAes } from "@/lib/aes/referentiel";
import { AnnexeTable, SchemasTpe } from "./Annexes";

export type CleAnnexe = "A" | "B" | "C" | "D" | "E" | "F" | "G";
export const CLES_ANNEXES: CleAnnexe[] = ["A", "B", "C", "D", "E", "F", "G"];

const COURTS: Record<CleAnnexe, string> = {
  A: "Risque",
  B: "TPE VIH",
  C: "TPE VHB",
  D: "Vaccination VHB",
  E: "Calendrier",
  F: "Consultations",
  G: "Conseils",
};

export default function AnnexesDrawer({
  open,
  onClose,
  referentiel,
  annexe,
  onAnnexe,
  utiles = [],
}: {
  open: boolean;
  onClose: () => void;
  referentiel: ReferentielAes;
  /** annexe affichée */
  annexe: CleAnnexe;
  onAnnexe: (cle: CleAnnexe) => void;
  /** annexes utiles pour l'étape en cours (mises en avant) */
  utiles?: CleAnnexe[];
}) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} variant="persistent" slotProps={{ paper: { sx: { width: { xs: "100%", sm: 560 }, p: 2 } } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="h6">Annexes AES</Typography>
        <IconButton aria-label="Fermer les annexes" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Stack>

      {utiles.length > 0 && (
        <Stack direction="row" spacing={1} alignItems="center" mb={1} flexWrap="wrap" useFlexGap>
          <Typography variant="caption" color="text.secondary">
            Utiles pour cette étape :
          </Typography>
          {utiles.map((c) => (
            <Chip key={c} size="small" color="primary" variant={c === annexe ? "filled" : "outlined"} label={`${c} – ${COURTS[c]}`} onClick={() => onAnnexe(c)} />
          ))}
        </Stack>
      )}

      <Tabs value={annexe} onChange={(_, v: CleAnnexe) => onAnnexe(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
        {CLES_ANNEXES.map((c) => (
          <Tab key={c} value={c} label={c} title={COURTS[c]} sx={{ minWidth: 48 }} />
        ))}
      </Tabs>

      <Box sx={{ overflowY: "auto" }}>
        <AnnexeTable referentiel={referentiel} cle={annexe} />
        {annexe === "B" && <SchemasTpe referentiel={referentiel} />}
        <Typography variant="caption" color="text.secondary">
          Aide à la décision : le protocole du P23 et les recommandations nationales priment. Tableaux paramétrables dans Référentiels → AES.
        </Typography>
      </Box>
    </Drawer>
  );
}
