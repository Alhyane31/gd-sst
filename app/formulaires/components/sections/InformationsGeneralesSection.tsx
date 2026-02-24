"use client";

import { Grid, TextField } from "@mui/material";
import type { ChangeHandler, FormData } from "../types";

export default function InformationsGeneralesSection({
  data,
  onChange,
}: {
  data: FormData;
  onChange: ChangeHandler;
}) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Nom"
          value={data.nom}
          onChange={(e) => onChange("nom", e.target.value)}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Prénom"
          value={data.prenom}
          onChange={(e) => onChange("prenom", e.target.value)}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="date"
          label="Date de naissance"
          InputLabelProps={{ shrink: true }}
          value={data.dateNaissance}
          onChange={(e) => onChange("dateNaissance", e.target.value)}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Statut social"
          value={data.statutSocial}
          onChange={(e) => onChange("statutSocial", e.target.value)}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Matricule interne"
          value={data.matricule}
          onChange={(e) => onChange("matricule", e.target.value)}
        />
      </Grid>
    </Grid>
  );
}