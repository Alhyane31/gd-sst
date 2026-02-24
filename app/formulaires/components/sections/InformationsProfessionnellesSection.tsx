"use client";

import {
  Box,
  Grid,
  TextField,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import type { ChangeHandler, FormData } from "../types";

export default function InformationsProfessionnellesSection({
  data,
  onChange,
}: {
  data: FormData;
  onChange: ChangeHandler;
}) {
  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Formation"
            value={data.formation}
            onChange={(e) => onChange("formation", e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Service"
            value={data.service}
            onChange={(e) => onChange("service", e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Date d’affectation CHU"
            InputLabelProps={{ shrink: true }}
            value={data.dateAffectationChu}
            onChange={(e) => onChange("dateAffectationChu", e.target.value)}
          />
        </Grid>
      </Grid>

      <Box mt={3}>
        <Typography mb={1}>Exercice dans un établissement autre que le CHU auparavant ?</Typography>

        <RadioGroup
          row
          value={data.autreEtablissement}
          onChange={(e) => onChange("autreEtablissement", e.target.value)}
        >
          <FormControlLabel value="oui" control={<Radio />} label="Oui" />
          <FormControlLabel value="non" control={<Radio />} label="Non" />
        </RadioGroup>

        {data.autreEtablissement === "oui" && (
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Lieu de travail"
                value={data.lieuTravail}
                onChange={(e) => onChange("lieuTravail", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Durée (années)"
                value={data.dureeAnnees}
                onChange={(e) => onChange("dureeAnnees", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Horaires"
                value={data.horaires}
                onChange={(e) => onChange("horaires", e.target.value)}
              />
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
}