"use client";

import {
  Grid, Divider, Typography, FormControl, FormLabel,
  RadioGroup, FormControlLabel, Radio, Checkbox, FormGroup, TextField,
} from "@mui/material";
import type { ChangeHandler, FormData } from "../types";

const MOTIFS = [
  { value: "TRAVAIL_NUIT",       label: "Travail de nuit" },
  { value: "RAYONNEMENTS",       label: "Exposition aux rayonnements ionisants" },
  { value: "EXPERTISE",          label: "Expertise Médicale" },
  { value: "PATHO_CHRONIQUE",    label: "Pathologie chronique, immunodépression (Cancer, immunodéficiences primitives, HIV, tuberculose sévère, connectivite, prise médicamenteuse...)" },
  { value: "GROSSESSE",          label: "Grossesse" },
  { value: "REPRISE_ARRET",      label: "Intégration après un Certificat Médical d'arrêt de travail" },
  { value: "REPRISE_COMMISSION", label: "Intégration après la Commission Médicale d'Embauche" },
];

export default function SuiviRapprocheSection({
  data,
  onChange,
  typeVisite,
}: {
  data: FormData;
  onChange: ChangeHandler;
  typeVisite: string;
}) {
  const isRapprochee  = typeVisite === "RAPPROCHEE";
  const showQuestion  = !isRapprochee;
  const showQuestionNePlus = isRapprochee;
  const showMotifs    = isRapprochee
  ? data.nePlusNecessiterSuivi !== true   // masqué si "ne nécessite plus"
  : data.necessitatSuiviRapproche === true;

const showProchaine = isRapprochee
  ? data.nePlusNecessiterSuivi !== true
  : data.necessitatSuiviRapproche === true;
  const toggleMotif = (value: string) => {
    const current = data.motifsSuiviRapproche ?? [];
    onChange(
      "motifsSuiviRapproche",
      current.includes(value) ? current.filter((m) => m !== value) : [...current, value]
    );
  };

 return (
  <Grid container spacing={2}>

    {/* Question 1 : nécessite suivi — seulement si pas RAPPROCHEE */}
    {showQuestion && (
      <Grid item xs={12}>
        <FormControl>
          <FormLabel sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>
            Nécessite un suivi médical rapproché ?
          </FormLabel>
          <RadioGroup
            row
            value={data.necessitatSuiviRapproche == null ? "" : String(data.necessitatSuiviRapproche)}
            onChange={(e) => {
              const val = e.target.value === "true";
              onChange("necessitatSuiviRapproche", val);
              if (!val) {
                onChange("motifsSuiviRapproche", []);
                onChange("prochainVisiteMois", null);
              }
            }}
          >
            <FormControlLabel value="true"  control={<Radio />} label="Oui" />
            <FormControlLabel value="false" control={<Radio />} label="Non" />
          </RadioGroup>
        </FormControl>
      </Grid>
    )}

    {/* Question inverse : ne nécessite plus — seulement si RAPPROCHEE */}
    {showQuestionNePlus && (
      <Grid item xs={12}>
        <FormControl>
          <FormLabel sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>
            Ne nécessite plus un suivi médical rapproché ?
          </FormLabel>
          <RadioGroup
            row
            value={data.nePlusNecessiterSuivi == null ? "" : String(data.nePlusNecessiterSuivi)}
            onChange={(e) => {
              const val = e.target.value === "true";
              onChange("nePlusNecessiterSuivi", val);
              if (val) {
                onChange("motifsSuiviRapproche", []);
                onChange("prochainVisiteMois", null);
              }
            }}
          >
            <FormControlLabel value="true"  control={<Radio />} label="Oui" />
            <FormControlLabel value="false" control={<Radio />} label="Non" />
          </RadioGroup>
        </FormControl>
      </Grid>
    )}

    {/* Motifs */}
    {showMotifs && (
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="h6" mt={2} mb={2}>
          Motif(s) du suivi rapproché
        </Typography>
        <FormGroup>
          {MOTIFS.map((m) => (
            <FormControlLabel
              key={m.value}
              control={
                <Checkbox
                  size="small"
                  checked={(data.motifsSuiviRapproche ?? []).includes(m.value)}
                  onChange={() => toggleMotif(m.value)}
                />
              }
              label={<Typography variant="body2">{m.label}</Typography>}
            />
          ))}
        </FormGroup>
      </Grid>
    )}

    {/* Prochaine visite */}
    {showProchaine && (
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="h6" mt={2} mb={2}>
          Prochaine visite
        </Typography>
        <TextField
          type="number"
          label="Dans combien de mois ?"
          size="small"
          sx={{ minWidth: 220 }}
          value={data.prochainVisiteMois ?? ""}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            onChange("prochainVisiteMois", isNaN(v) ? null : Math.min(12, Math.max(1, v)));
          }}
          inputProps={{ min: 1, max: 12, step: 1 }}
          helperText="Entre 1 et 12 mois"
        />
      </Grid>
    )}

  </Grid>
);}