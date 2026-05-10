"use client";

import {
  Box, Divider, Typography, FormControl, FormLabel,
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
  categoriePersonnel,
}: {
  data: FormData;
  onChange: ChangeHandler;
  categoriePersonnel: string;
}) {
  const isSMR = categoriePersonnel === "SMR";
  const showQuestion       = !isSMR;
  const showQuestionNePlus = isSMR;
  const showMotifs    = !isSMR
    ?  data.necessitatSuiviRapproche === true : false;
  const showProchaine = isSMR
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
    <Box>
      {/* Décision d'aptitude et recommandations */}
      <Typography variant="h6" mb={2}>
        Décision d'aptitude et recommandations
      </Typography>

      <Typography variant="subtitle1" mb={1}>
        Décision d'aptitude au décours de la visite médicale du jour *
      </Typography>
      <RadioGroup
        value={data.decisionAptitude}
        onChange={(e) =>
          onChange(
            "decisionAptitude",
            e.target.value as "APTE" | "APTE_AVEC_RESTRICTIONS" | "INAPTE_AVEC_RECLASSEMENT"
          )
        }
      >
        <FormControlLabel value="APTE" control={<Radio />} label="Apte" />
        <FormControlLabel value="APTE_AVEC_RESTRICTIONS" control={<Radio />} label="Apte avec restrictions" />
        <FormControlLabel value="INAPTE_AVEC_RECLASSEMENT" control={<Radio />} label="Inapte avec reclassement professionnel" />
      </RadioGroup>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" mb={1}>
        Recommandation : Avis médical spécialisé, Bilans à demander, Orientation... *
      </Typography>
      <TextField
        fullWidth
        required
        multiline
        minRows={4}
        value={data.recommandations}
        onChange={(e) => onChange("recommandations", e.target.value)}
      />

      <Divider sx={{ my: 3 }} />

      {/* Suivi rapproché */}
      {showQuestion && (
        <Box mb={2}>
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
        </Box>
      )}

      {showQuestionNePlus && (
        <Box mb={2}>
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
        </Box>
      )}

      {showMotifs && (
        <Box>
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
        </Box>
      )}

      {showProchaine && (
        <Box>
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
            slotProps={{ input: { inputProps: { min: 1, max: 12, step: 1 } } }}
            helperText="Entre 1 et 12 mois"
          />
        </Box>
      )}
    </Box>
  );
}
