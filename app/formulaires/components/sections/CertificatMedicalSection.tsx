"use client";

import {
  Box, Divider, FormControl, FormControlLabel, Grid,
  Radio, RadioGroup, TextField, Typography,
} from "@mui/material";
import type { ChangeHandler, FormData } from "../types";

const TYPES_CERTIFICAT = [
  { value: "ARRET_TRAVAIL",     label: "Arrêt de travail" },
  { value: "REPRISE_TRAVAIL",   label: "Reprise de travail" },
  { value: "CONGE_MMD",         label: "Congé de Maladie de Moyenne Durée (MMD)" },
  { value: "CONGE_MLD",         label: "Congé de Maladie de Longue Durée (MLD)" },
  { value: "DISPONIBILITE_SANTE", label: "Disponibilité pour raison de santé" },
  { value: "AUTRE",             label: "Autre" },
];

const AVIS_OPTIONS = [
  { value: "CONFORME",     label: "Conforme" },
  { value: "NON_CONFORME", label: "Non conforme" },
  { value: "A_VERIFIER",  label: "À vérifier / Complément d'information requis" },
];

export default function CertificatMedicalSection({
  data,
  onChange,
}: {
  data: FormData;
  onChange: ChangeHandler;
}) {
  return (
    <Box>
      <Typography variant="h6" mb={2}>
        Informations du certificat médical
      </Typography>

      {/* Type de certificat */}
      <Typography variant="subtitle1" mb={1}>
        Type de certificat médical *
      </Typography>
      <FormControl>
        <RadioGroup
          value={data.cmTypeCertificat}
          onChange={(e) => onChange("cmTypeCertificat", e.target.value as FormData["cmTypeCertificat"])}
        >
          {TYPES_CERTIFICAT.map((t) => (
            <FormControlLabel key={t.value} value={t.value} control={<Radio />} label={t.label} />
          ))}
        </RadioGroup>
      </FormControl>

      <Divider sx={{ my: 3 }} />

      {/* Dates et durée */}
      <Typography variant="h6" mb={2}>
        Période couverte
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <TextField
            type="date"
            label="Date de début *"
            size="small"
            fullWidth
            value={data.cmDateDebut}
            onChange={(e) => onChange("cmDateDebut", e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            type="date"
            label="Date de fin"
            size="small"
            fullWidth
            value={data.cmDateFin}
            onChange={(e) => onChange("cmDateFin", e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            type="number"
            label="Durée (jours)"
            size="small"
            fullWidth
            value={data.cmNombreJours}
            onChange={(e) => onChange("cmNombreJours", e.target.value)}
            inputProps={{ min: 1 }}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Diagnostic */}
      <Typography variant="subtitle1" mb={1}>
        Motif / Diagnostic succinct *
      </Typography>
      <TextField
        fullWidth
        multiline
        minRows={3}
        value={data.cmDiagnostic}
        onChange={(e) => onChange("cmDiagnostic", e.target.value)}
        placeholder="Ex : lombalgies chroniques, syndrome anxio-dépressif..."
      />

      <Divider sx={{ my: 3 }} />

      {/* Avis SST */}
      <Typography variant="h6" mb={2}>
        Avis du Service de Santé au Travail
      </Typography>

      <Typography variant="subtitle1" mb={1}>
        Avis SST sur le certificat médical *
      </Typography>
      <FormControl>
        <RadioGroup
          value={data.cmAvisSst}
          onChange={(e) => onChange("cmAvisSst", e.target.value as FormData["cmAvisSst"])}
        >
          {AVIS_OPTIONS.map((a) => (
            <FormControlLabel key={a.value} value={a.value} control={<Radio />} label={a.label} />
          ))}
        </RadioGroup>
      </FormControl>

      <Divider sx={{ my: 3 }} />

      {/* Recommandations */}
      <Typography variant="subtitle1" mb={1}>
        Recommandations du SST
      </Typography>
      <TextField
        fullWidth
        multiline
        minRows={4}
        value={data.cmRecommandations}
        onChange={(e) => onChange("cmRecommandations", e.target.value)}
        placeholder="Recommandations pour la reprise, aménagement du poste, orientation médicale..."
      />
    </Box>
  );
}
