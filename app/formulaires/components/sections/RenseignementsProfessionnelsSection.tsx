"use client";

import {
  Box,
  Grid,
  TextField,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
} from "@mui/material";
import type { ChangeHandler, FormData } from "../types";

export default function RenseignementsProfessionnelsSection({
  data,
  onChange,
}: {
  data: FormData;
  onChange: ChangeHandler;
}) {
  return (
    <Box>
      <Typography variant="h6" mb={1}>
        Travail de garde
      </Typography>

      <RadioGroup
        row
        value={data.travailGarde}
        onChange={(e) => onChange("travailGarde", e.target.value)}
      >
        <FormControlLabel value="oui" control={<Radio />} label="Oui" />
        <FormControlLabel value="non" control={<Radio />} label="Non" />
      </RadioGroup>

      {data.travailGarde === "oui" && (
        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre d’heures de garde"
              value={data.heuresGarde}
              onChange={(e) => onChange("heuresGarde", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Rythme (ex: 1/3, 2 fois/semaine...)"
              value={data.rythmeGarde}
              onChange={(e) => onChange("rythmeGarde", e.target.value)}
            />
          </Grid>
        </Grid>
      )}

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" mb={1}>
        Travail de nuit
      </Typography>

      <RadioGroup
        row
        value={data.travailNuit}
        onChange={(e) => onChange("travailNuit", e.target.value)}
      >
        <FormControlLabel value="oui" control={<Radio />} label="Oui" />
        <FormControlLabel value="non" control={<Radio />} label="Non" />
      </RadioGroup>

      {data.travailNuit === "oui" && (
        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre de nuits / mois"
              value={data.nbNuitsMois}
              onChange={(e) => onChange("nbNuitsMois", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Horaires de nuit (ex: 20h-8h)"
              value={data.horairesNuit}
              onChange={(e) => onChange("horairesNuit", e.target.value)}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}