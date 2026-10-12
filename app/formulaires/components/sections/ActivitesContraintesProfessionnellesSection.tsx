"use client";

import {
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import MeasureInput from "@/app/formulaires/examen/components/MeasureInput";
import type { ChangeHandler, FormData } from "../types";

const TYPES_CONTRAINTES = [
  { value: "BRUIT", label: "Bruit" },
  { value: "VIBRATIONS", label: "Vibrations mécaniques" },
  { value: "CONTRAINTES_THERMIQUES", label: "Contraintes thermiques (chaleur / froid)" },
  { value: "AGENTS_CHIMIQUES", label: "Agents chimiques" },
  { value: "AGENTS_BIOLOGIQUES", label: "Agents biologiques" },
  { value: "RAYONNEMENTS", label: "Rayonnements (ionisants / non ionisants)" },
  { value: "CHARGE_PHYSIQUE", label: "Charge physique (port de charges)" },
  { value: "CHARGE_MENTALE", label: "Charge mentale / stress" },
  { value: "POSTURES_CONTRAIGNANTES", label: "Postures contraignantes" },
  { value: "TRAVAIL_ECRAN", label: "Travail sur écran prolongé" },
];

// « Aides techniques » et « Posture prédominante » ne sont plus saisies :
// les valeurs des dossiers existants restent conservées (presenceAideTechnique, posturesPredominantes).

export default function ActivitesContraintesProfessionnellesSection({
  data,
  onChange,
}: {
  data: FormData;
  onChange: ChangeHandler;
}) {
  const typesContraintes = data.typesContraintes ?? [];

  const toggleContrainte = (value: string) => {
    const next = typesContraintes.includes(value)
      ? typesContraintes.filter((v) => v !== value)
      : [...typesContraintes, value];
    onChange("typesContraintes", next);
  };

  return (
    <Box>
      <Typography variant="h6" mb={2}>
        Activité professionnelle
      </Typography>

      <Typography variant="subtitle1" mb={1}>
        Nombre de personnes dans votre équipe
      </Typography>
      <MeasureInput
        label="Nombre"
        unit="personnes"
        integer
        min={0}
        value={data.nombrePersonnelsEquipe}
        onChange={(v) => onChange("nombrePersonnelsEquipe", v)}
      />

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" mb={1}>
        Tâches professionnelles effectuées au cours d&apos;un cycle de travail
      </Typography>
      <TextField
        fullWidth
        multiline
        minRows={4}
        value={data.tachesProfessionnelles}
        onChange={(e) => onChange("tachesProfessionnelles", e.target.value)}
      />

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        <Box>
          <Typography variant="subtitle1" mb={1}>
            Durée d&apos;un cycle de travail
          </Typography>
          <MeasureInput
            label="Durée"
            unit="heures"
            min={0}
            max={168}
            value={data.dureeCycleHeures}
            onChange={(v) => onChange("dureeCycleHeures", v)}
          />
        </Box>
        <Box>
          <Typography variant="subtitle1" mb={1}>
            Nombre de patients pris en charge par journée de travail
          </Typography>
          <MeasureInput
            label="Nombre"
            unit="patients"
            integer
            min={0}
            value={data.nombrePatientsJour}
            onChange={(v) => onChange("nombrePatientsJour", v)}
          />
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" mb={2}>
        Contraintes professionnelles
      </Typography>

      <Typography variant="subtitle1" mb={1}>
        Présence de contraintes dans son travail
      </Typography>

      <RadioGroup
        row
        value={data.presenceContraintes}
        onChange={(e) => {
          onChange("presenceContraintes", e.target.value as "oui" | "non");
          if (e.target.value === "non") {
            onChange("typesContraintes", []);
          }
        }}
      >
        <FormControlLabel value="oui" control={<Radio />} label="Oui" />
        <FormControlLabel value="non" control={<Radio />} label="Non" />
      </RadioGroup>

      {data.presenceContraintes === "oui" && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" mb={1}>
            Si oui, préciser le(s) type(s) de contrainte(s)
          </Typography>

          <Box>
            {TYPES_CONTRAINTES.map((c) => (
              <Box key={c.value}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={typesContraintes.includes(c.value)}
                      onChange={() => toggleContrainte(c.value)}
                    />
                  }
                  label={c.label}
                />
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
