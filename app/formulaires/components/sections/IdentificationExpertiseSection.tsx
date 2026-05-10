"use client";

import {
  Box, Divider, Typography,
  FormControl, FormLabel, RadioGroup, FormControlLabel, Radio,
  TextField,
} from "@mui/material";
import type { ChangeHandler, FormData } from "../types";

const SOURCES = [
  { value: "CHEF_SERVICE",        label: "Chef de service" },
  { value: "PERSONNEL",           label: "Personnel lui-même" },
  { value: "COMMISSION_MEDICALE", label: "Commission médicale" },
  { value: "DIRECTION",           label: "Direction" },
  { value: "SERVICE_SANTE_TRAVAIL", label: "Service de Santé au Travail" },
];

const MOTIFS = [
  { value: "EVALUATION_APTITUDE",         label: "Évaluation d'aptitude" },
  { value: "MUTATION_SANTE",              label: "Mutation pour raison de santé" },
  { value: "RETRAITE_ANTICIPEE",          label: "Mise à la retraite anticipée pour raison de santé" },
  { value: "ABSENCE_SANTE",              label: "Absence pour raison de santé" },
  { value: "REPRISE_ARRET_PSYCHIATRIQUE", label: "Reprise de travail après arrêt travail pour motif psychiatrique" },
  { value: "DISPONIBILITE_SANTE",         label: "Mise en disponibilité pour raison de santé" },
  { value: "CONGE_MMD",                   label: "Congé de Maladie de Moyenne Durée" },
  { value: "CONGE_MLD",                   label: "Congé de Maladie de Longue Durée" },
];

export default function IdentificationExpertiseSection({
  data,
  onChange,
}: {
  data: FormData;
  onChange: ChangeHandler;
}) {
  return (
    <Box>
      <Typography variant="h6" mb={2}>
        Réception de la demande d'expertise médicale
      </Typography>

      {/* Q1 — Date de réception */}
      <Typography variant="subtitle1" mb={1}>
        Date de réception de la demande d'expertise médicale *
      </Typography>
      <TextField
        type="date"
        required
        size="small"
        sx={{ minWidth: 220 }}
        value={data.expertiseDateReception}
        onChange={(e) => onChange("expertiseDateReception", e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Divider sx={{ my: 3 }} />

      {/* Q2 — Source de la demande */}
      <Typography variant="subtitle1" mb={1}>
        Source de la demande *
      </Typography>
      <FormControl>
        <RadioGroup
          value={data.expertiseSource}
          onChange={(e) => onChange("expertiseSource", e.target.value as FormData["expertiseSource"])}
        >
          {SOURCES.map((s) => (
            <FormControlLabel key={s.value} value={s.value} control={<Radio />} label={s.label} />
          ))}
        </RadioGroup>
      </FormControl>

      <Divider sx={{ my: 3 }} />

      {/* Q3 — Motif de la demande */}
      <Typography variant="subtitle1" mb={1}>
        Motif de la demande d'expertise médicale *
      </Typography>
      <FormControl>
        <RadioGroup
          value={data.expertiseMotif}
          onChange={(e) => onChange("expertiseMotif", e.target.value as FormData["expertiseMotif"])}
        >
          {MOTIFS.map((m) => (
            <FormControlLabel key={m.value} value={m.value} control={<Radio />} label={m.label} />
          ))}
        </RadioGroup>
      </FormControl>
    </Box>
  );
}
