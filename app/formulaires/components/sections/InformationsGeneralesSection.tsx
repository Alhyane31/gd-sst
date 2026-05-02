"use client";

import { Typography ,Divider} from "@mui/material";
import type { ChangeHandler, FormData } from "../types";
import { Grid, TextField, MenuItem } from "@mui/material";
export default function InformationsGeneralesSection({
  data,
  onChange,
}: {
  data: FormData;
  onChange: ChangeHandler;
}) {
  return (
    <Grid container spacing={2}>
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Nom"
          sx={{ minWidth: 220 }}
          value={data.nom}
          onChange={(e) => onChange("nom", e.target.value)}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          sx={{ minWidth: 220 }}
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
          sx={{ minWidth: 220 }}
          InputLabelProps={{ shrink: true }}
          value={data.dateNaissance}
          onChange={(e) => onChange("dateNaissance", e.target.value)}
        />
      </Grid>

      <Grid item xs={12} md={6}>
       <TextField
  select
  fullWidth
  sx={{ minWidth: 220 }}
  label="Statut social"
  value={data.statutSocial}
  onChange={(e) => onChange("statutSocial", e.target.value)}
>
  <MenuItem value="">Sélectionner</MenuItem>
  <MenuItem value="CELIBATAIRE">Célibataire</MenuItem>
  <MenuItem value="MARIE">Marié(e)</MenuItem>
  <MenuItem value="DIVORCE">Divorcé(e)</MenuItem>
  <MenuItem value="VEUF">Veuf / Veuve</MenuItem>
</TextField>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          sx={{ minWidth: 220 }}
          label="Matricule interne"
          value={data.matricule}
          onChange={(e) => onChange("matricule", e.target.value)}
        />
      </Grid>
</Grid>
<Grid >
      
    {data.typeVisite === "RAPPROCHEE" && (
  <>
  
  
    <Grid item xs={12}>
      
<Divider sx={{ my: 3 }} />
      <Typography variant="h6" mt={2} mb={2}>
        Motif de la consultation
      </Typography>

    
      <TextField
        select
        fullWidth
          sx={{ minWidth: 400 }}
        label="Motif de la consultation *"
        value={data.motifConsultation ?? ""}
        onChange={(e) => onChange("motifConsultation", e.target.value)}
      >
        <MenuItem value="">Sélectionner</MenuItem>
        <MenuItem value="TRAVAIL_NUIT">Travail de nuit</MenuItem>
        <MenuItem value="RAYONNEMENTS">Exposition aux rayonnements ionisants</MenuItem>
        <MenuItem value="EXPERTISE">Expertise médicale</MenuItem>
        <MenuItem value="PATHO_CHRONIQUE">
          Pathologie chronique / immunodépression
        </MenuItem>
        <MenuItem value="GROSSESSE">Grossesse</MenuItem>
        <MenuItem value="REPRISE_ARRET">
          Intégration après arrêt de travail
        </MenuItem>
        <MenuItem value="REPRISE_COMMISSION">
          Intégration après commission médicale d'embauche
        </MenuItem>
      </TextField>
    </Grid>
  </>
)}
    </Grid>
    </Grid>
    
  );
}