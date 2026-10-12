"use client";

import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  MenuItem,
  Typography,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";

import { useState } from "react";

const steps = [
  "Informations générales",
  "Renseignement professionnel",
  "Travail de garde",
  "Antécédents médicaux",
];

export default function PersonnelFormStepper() {
  const [activeStep, setActiveStep] = useState(0);

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    formation: "",
    service: "",

    autreEtablissement: "non",
    lieuTravail: "",
    duree: "",
    horaires: "",
    dateAffectationChu: "",

    travailGarde: "non",
    heuresGarde: "",
    rythmeGarde: "",

    antecedents: "",
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = () => {
    console.log("Données envoyées :", formData);
    // fetch("/api/personnel", { method: "POST", body: JSON.stringify(formData) })
  };

  return (
    <Box p={4}>
      <Typography variant="h4" mb={3}>
        Création du personnel
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 4 }}>
        {/* 🔹 STEP 1 */}
        {activeStep === 0 && (
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Nom" name="nom" onChange={handleChange} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Prénom" name="prenom" onChange={handleChange} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Formation" name="formation" onChange={handleChange} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Service" name="service" onChange={handleChange} />
            </Grid>
          </Grid>
        )}

        {/* 🔹 STEP 2 */}
        {activeStep === 1 && (
          <Box>
            <Typography mb={2}>Exercice dans un autre établissement ?</Typography>
            <RadioGroup
              row
              name="autreEtablissement"
              value={formData.autreEtablissement}
              onChange={handleChange}
            >
              <FormControlLabel value="oui" control={<Radio />} label="Oui" />
              <FormControlLabel value="non" control={<Radio />} label="Non" />
            </RadioGroup>

            {formData.autreEtablissement === "oui" && (
              <Grid container spacing={2} mt={1}>
                <Grid size={{ xs: 4 }}>
                  <TextField fullWidth label="Lieu de travail" name="lieuTravail" onChange={handleChange} />
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <TextField fullWidth label="Durée" name="duree" onChange={handleChange} />
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <TextField fullWidth label="Horaires" name="horaires" onChange={handleChange} />
                </Grid>
              </Grid>
            )}

            <Box mt={2}>
              <TextField
                fullWidth
                type="date"
                label="Date d’affectation CHU"
                name="dateAffectationChu"
                InputLabelProps={{ shrink: true }}
                onChange={handleChange}
              />
            </Box>
          </Box>
        )}

        {/* 🔹 STEP 3 */}
        {activeStep === 2 && (
          <Box>
            <Typography mb={2}>Travail de garde ?</Typography>
            <RadioGroup
              row
              name="travailGarde"
              value={formData.travailGarde}
              onChange={handleChange}
            >
              <FormControlLabel value="oui" control={<Radio />} label="Oui" />
              <FormControlLabel value="non" control={<Radio />} label="Non" />
            </RadioGroup>

            {formData.travailGarde === "oui" && (
              <Grid container spacing={2} mt={1}>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth label="Nombre d’heures" name="heuresGarde" onChange={handleChange} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth label="Rythme" name="rythmeGarde" onChange={handleChange} />
                </Grid>
              </Grid>
            )}
          </Box>
        )}

        {/* 🔹 STEP 4 */}
        {activeStep === 3 && (
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Antécédents médicaux"
            name="antecedents"
            onChange={handleChange}
          />
        )}

        {/* 🔘 Actions */}
        <Box mt={4} display="flex" justifyContent="space-between">
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Précédent
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button variant="contained" onClick={handleSubmit}>
              Enregistrer
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>
              Suivant
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
