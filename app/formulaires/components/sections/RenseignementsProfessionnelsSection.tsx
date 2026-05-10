"use client";

import {
  Alert,
  Box,
  Grid,
  TextField,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Checkbox,
  TableBody,
} from "@mui/material";
import type { ChangeHandler, FormData, OuiNon } from "../types";

export default function RenseignementsProfessionnelsSection({
  data,
  onChange,
}: {
  data: FormData;
  onChange: ChangeHandler;
}) {const formesHoraireAtypique = data.formesHoraireAtypique ?? [];

const toggleFormeHoraireAtypique = (value: string) => {
  const next = formesHoraireAtypique.includes(value)
    ? formesHoraireAtypique.filter((v) => v !== value)
    : [...formesHoraireAtypique, value];

  onChange("formesHoraireAtypique", next);
};
  return (


    
    <Box>

      {!data.categorieForm && (
        <Alert severity="info">
          Merci de sélectionner un poste pour afficher cette section.
        </Alert>
      )}

      {data.categorieForm === "B" && (
  <>
    <Typography variant="h6" mb={1}>
      Horaires de travail
    </Typography>

    
    <Paper variant="outlined" sx={{ mb: 2, overflow: "hidden" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell sx={{ fontWeight: "bold" }}>Semaine standard</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Semaine atypique</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          <TableRow>
            <TableCell>Les horaires</TableCell>
            <TableCell>Entre 7 h et 20 h</TableCell>
            <TableCell>De 21 h à 6 h</TableCell>
          </TableRow>

          <TableRow>
            <TableCell>Les jours travaillés</TableCell>
            <TableCell>5 jours : du lundi au vendredi</TableCell>
            <TableCell>
              Nombre variable : samedi, dimanche ou les jours fériés
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell>L’amplitude de la journée</TableCell>
            <TableCell>8 h</TableCell>
            <TableCell>En-deçà de 5 h ou au-delà de 8 h</TableCell>
          </TableRow>

          <TableRow>
            <TableCell>La structure de la journée</TableCell>
            <TableCell>
              Durée continue avec une pause déjeuner entre 12 h et 14 h
            </TableCell>
            <TableCell>
              Temps morcelé, fragmenté par des coupures de durées variables
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell>Le rythme du temps de travail</TableCell>
            <TableCell>
              5 jours travaillés et 2 jours de repos consécutifs en fin de semaine
            </TableCell>
            <TableCell>
              Régulier cyclique (3x8, 2x12) ou irrégulier
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Paper>

    <RadioGroup
      row
      value={data.horairesTravail ?? ""}
      onChange={(e) => onChange("horairesTravail", e.target.value)}
    >
      <FormControlLabel
        value="SEMAINE_STANDARD"
        control={<Radio />}
        label="Semaine standard"
      />
      <FormControlLabel
        value="SEMAINE_ATYPIQUE"
        control={<Radio />}
        label="Semaine atypique"
      />
    </RadioGroup>

    <Divider sx={{ my: 3 }} />
  </>
)}
{/* Personnel administratif (catégorie C) : horaires simplifiés uniquement */}
{data.categorieForm === "C" && (
  <>
    <Typography variant="h6" mb={1}>
      Préciser les horaires de travail
    </Typography>

    <RadioGroup
      value={data.horaireTravailPrecision ?? ""}
      onChange={(e) => onChange("horaireTravailPrecision", e.target.value as FormData["horaireTravailPrecision"])}
    >
      <FormControlLabel value="08H00_14H00" control={<Radio />} label="08h00 - 14h00" />
      <FormControlLabel value="08H00_16H00" control={<Radio />} label="08h00 - 16h00" />
    </RadioGroup>
  </>
)}

{/* Catégorie A et B semaine standard : horaires complets + garde */}
{(data.categorieForm === "A" || data.horairesTravail === "SEMAINE_STANDARD") && data.categorieForm !== "C" && (
  <>
    <Typography variant="h6" mb={1}>
      Préciser les horaires de travail
    </Typography>

    <RadioGroup
      value={data.horaireTravailPrecision ?? ""}
      onChange={(e) => onChange("horaireTravailPrecision", e.target.value as FormData["horaireTravailPrecision"])}
    >
      <FormControlLabel value="08H00_14H00" control={<Radio />} label="08h00 - 14h00" />
      <FormControlLabel value="08H00_16H00" control={<Radio />} label="08h00 - 16h00" />
      <FormControlLabel value="14H00_20H00" control={<Radio />} label="14h00 - 20h00" />
    </RadioGroup>

    <Divider sx={{ my: 3 }} />

    <Typography variant="h6" mb={1}>
      Travail de garde
    </Typography>

    <RadioGroup
      row
      value={data.travailGarde}
      onChange={(e) => onChange("travailGarde", e.target.value as OuiNon)}
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
  </>
)}

{data.horairesTravail === "SEMAINE_ATYPIQUE" && data.categorieForm !== "C" && (
  <>
    <Typography variant="h6" mb={1}>
      Forme d'horaire atypique
    </Typography>

    <Typography variant="body2" color="text.secondary" mb={2}>
      Plusieurs réponses possibles.
    </Typography>

    <Box>
      <FormControlLabel
        control={
          <Checkbox
            checked={formesHoraireAtypique.includes("HORAIRES_20H_8H")}
            onChange={() => toggleFormeHoraireAtypique("HORAIRES_20H_8H")}
          />
        }
        label="Horaires : de 20h à 8h"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={formesHoraireAtypique.includes("JOURS_VARIABLES")}
            onChange={() => toggleFormeHoraireAtypique("JOURS_VARIABLES")}
          />
        }
        label="Nombre de jours travaillés : nombre variable (samedis, dimanches et jours fériés)"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={formesHoraireAtypique.includes("AMPLITUDE_SUP_8H")}
            onChange={() => toggleFormeHoraireAtypique("AMPLITUDE_SUP_8H")}
          />
        }
        label="Amplitude de la journée : au-delà de 8h"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={formesHoraireAtypique.includes("RYTHME_CYCLIQUE_IRREGULIER")}
            onChange={() => toggleFormeHoraireAtypique("RYTHME_CYCLIQUE_IRREGULIER")}
          />
        }
        label="Rythme du temps de travail : régulier cyclique (3×8, 2×12) ou irrégulier"
      />
    </Box>

    <Divider sx={{ my: 3 }} />
  </>
)}
{(data.categorieForm === "B" ) && (
  <>
   <Typography variant="h6" mb={1}>
  Travail de nuit
</Typography>

<Typography variant="subtitle1" mb={1}>
  Poste de nuit fixe *
</Typography>


<RadioGroup
  row
  value={data.posteNuitFixe ?? ""}
  onChange={(e) => {
    onChange("posteNuitFixe", e.target.value);

    if (e.target.value === "non") {
      onChange("rythmeTravailNuit", "");
      onChange("heuresNuitMois", "");
    }
  }}
>
  <FormControlLabel value="oui" control={<Radio />} label="Oui" />
  <FormControlLabel value="non" control={<Radio />} label="Non" />
</RadioGroup>

{data.posteNuitFixe === "non" && (
  <>
    <Divider sx={{ my: 3 }} />

    <Typography variant="h6" mb={1}>
      Renseignements sur le travail de nuit
    </Typography>

    <Grid container spacing={2} mt={1}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" mb={1}>
          Préciser le rythme du travail de nuit effectué *
        </Typography>

        <RadioGroup
          row
          value={data.rythmeTravailNuit ?? ""}
          onChange={(e) => onChange("rythmeTravailNuit", e.target.value)}
        >
          <FormControlLabel value="3x8" control={<Radio />} label="3×8" />
          <FormControlLabel value="2x12" control={<Radio />} label="2×12" />
          <FormControlLabel
            value="ROULEMENT_HEBDOMADAIRE"
            control={<Radio />}
            label="Roulement hebdomadaire"
          />
          <FormControlLabel
            value="ROULEMENT_MENSUEL"
            control={<Radio />}
            label="Roulement mensuel"
          />
        </RadioGroup>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Nombre d'heures travaillées la nuit / mois *"
          value={data.heuresNuitMois ?? ""}
          onChange={(e) => onChange("heuresNuitMois", e.target.value)}
        />
      </Grid>
    </Grid>
  </>
)}

<Divider sx={{ my: 3 }} />

<Typography variant="h6" mb={1}>
  Jours de repos
</Typography>

<Grid container spacing={2} mt={1}>
  <Grid item xs={12} md={8}>
    <TextField
      fullWidth
      type="number"
      label="Nombre de jours de repos hors congés pendant une année de travail"
      helperText="Base : 48 semaines de travail"
      value={data.joursReposAnnee ?? ""}
      onChange={(e) => onChange("joursReposAnnee", e.target.value)}
    />
  </Grid>
</Grid>  </>
)}
      
    </Box>
  );
}