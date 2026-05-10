"use client";

import {
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
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
      {/* Q58 */}
      <Typography variant="h6" mb={2}>
        Activité professionnelle
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            type="number"
            label="Nombre de personnels dans votre équipe"
            inputProps={{ min: 0 }}
            value={data.nombrePersonnelsEquipe}
            onChange={(e) => onChange("nombrePersonnelsEquipe", e.target.value)}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Q59 */}
      <Typography variant="subtitle1" mb={1}>
        Décrire les tâches professionnelles effectuées au cours d'un cycle de travail *
      </Typography>
      <TextField
        fullWidth
        required
        multiline
        minRows={4}
        value={data.tachesProfessionnelles}
        onChange={(e) => onChange("tachesProfessionnelles", e.target.value)}
      />

      <Divider sx={{ my: 3 }} />

      {/* Q60 */}
      <Typography variant="subtitle1" mb={1}>
        Présence d'aide technique *
      </Typography>
      
      <RadioGroup
        row
        value={data.presenceAideTechnique}
        onChange={(e) => onChange("presenceAideTechnique", e.target.value as "oui" | "non")}
      >
        <FormControlLabel value="oui" control={<Radio />} label="Oui" />
        <FormControlLabel value="non" control={<Radio />} label="Non" />
      </RadioGroup>

      <Divider sx={{ my: 3 }} />

      {/* Q61 */}
      <Typography variant="subtitle1" mb={1}>
        Postures prédominantes durant le travail *
      </Typography>
     
      <RadioGroup
        value={data.posturesPredominantes}
        onChange={(e) =>
          onChange(
            "posturesPredominantes",
            e.target.value as "ASSISE_PROLONGEE" | "DEBOUT_PROLONGEE" | "PAS_DE_POSITION_PROLONGEE"
          )
        }
      >
        <FormControlLabel
          value="ASSISE_PROLONGEE"
          control={<Radio />}
          label="Position assise prolongée"
        />
        <FormControlLabel
          value="DEBOUT_PROLONGEE"
          control={<Radio />}
          label="Position debout prolongée"
        />
        <FormControlLabel
          value="PAS_DE_POSITION_PROLONGEE"
          control={<Radio />}
          label="Pas de position prolongée"
        />
      </RadioGroup>

      <Divider sx={{ my: 3 }} />

      {/* Q62 */}
      <Typography variant="h6" mb={2}>
        Contraintes professionnelles
      </Typography>

      <Typography variant="subtitle1" mb={1}>
        Présence de contraintes dans son travail *
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

      {/* Q63 */}
      {data.presenceContraintes === "oui" && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" mb={1}>
            Si oui, préciser le(s) type(s) de contrainte(s) *
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
