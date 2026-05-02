"use client";

import {
  Box, Paper, Stepper, Step, StepLabel,
  Button, Typography, LinearProgress,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import type { FormData, FormSectionKey, ChangeHandler } from "./types";

import InformationsGeneralesSection from "./sections/InformationsGeneralesSection";
import InformationsProfessionnellesSection from "./sections/InformationsProfessionnellesSection";
import RenseignementsProfessionnelsSection from "./sections/RenseignementsProfessionnelsSection";
import AntecedentsSection from "./sections/AntecedentsSection";
import SuiviRapprocheSection from "./sections/SuiviRapprocheSection";

const ALL_STEPS: { key: FormSectionKey; label: string }[] = [
  { key: "INFORMATIONS_GENERALES",        label: "Informations générales" },
  { key: "INFORMATIONS_PROFESSIONNELLES", label: "Informations professionnelles" },
  { key: "RENSEIGNEMENTS_PROFESSIONNELS", label: "Renseignements professionnels" },
  { key: "ANTECEDENTS",                   label: "Antécédents" },
  { key: "SUIVI_RAPPROCHE",               label: "Suivi rapproché" },
];

type Props = {
  mode: "create" | "edit";
  initialData: FormData;
  typeVisite: string; // ✅ reçu depuis la visite parente
  title?: string;
  saving?: boolean;
  submitLabel?: string;
  formulaireStatut?: "DRAFT" | "SUBMITTED" | "VERIFIED" | "";
  onSubmit: (data: FormData) => Promise<void> | void;
};

export default function PersonnelFormStepper({
  mode,
  initialData,
  typeVisite,
  title,
  saving = false,
  formulaireStatut = "",
  submitLabel = "Enregistrer",
  onSubmit,
}: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialData);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  // SUIVI_RAPPROCHE toujours affiché — la section gère elle-même
  // ce qui est visible selon typeVisite
  const steps = ALL_STEPS;

  const stepKey = useMemo(() => steps[activeStep]?.key, [activeStep, steps]);

  const onFieldChange: ChangeHandler = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  const handleBack = () => setActiveStep((prev) => Math.max(prev - 1, 0));
  const handleSubmit = async () => await onSubmit(formData);

  return (
    <Box p={4}>
      <Typography variant="h4" mb={3}>
        {title ?? (mode === "edit" ? "Éditer le formulaire de visite" : "Nouveau formulaire de visite")}
      </Typography>

      {saving && <LinearProgress sx={{ mb: 2 }} />}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((s) => (
          <Step key={s.key}>
            <StepLabel>{s.label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 4 }}>
        {stepKey === "INFORMATIONS_GENERALES" && (
          <InformationsGeneralesSection data={formData} onChange={onFieldChange} />
        )}
        {stepKey === "INFORMATIONS_PROFESSIONNELLES" && (
          <InformationsProfessionnellesSection data={formData} onChange={onFieldChange} />
        )}
        {stepKey === "RENSEIGNEMENTS_PROFESSIONNELS" && (
          <RenseignementsProfessionnelsSection data={formData} onChange={onFieldChange} />
        )}
        {stepKey === "ANTECEDENTS" && (
          <AntecedentsSection data={formData} onChange={onFieldChange} />
        )}
        {stepKey === "SUIVI_RAPPROCHE" && (
          <SuiviRapprocheSection
            data={formData}
            onChange={onFieldChange}
            typeVisite={typeVisite} // ✅
          />
        )}

        <Box mt={4} display="flex" justifyContent="space-between">
          <Button disabled={activeStep === 0 || saving} onClick={handleBack}>
            Précédent
          </Button>

          {activeStep === steps.length - 1 ? (
            formulaireStatut !== "VERIFIED" ? (
              <Button variant="contained" disabled={saving} onClick={handleSubmit}>
                {submitLabel}
              </Button>
            ) : (
              <Box />
            )
          ) : (
            <Button variant="contained" disabled={saving} onClick={handleNext}>
              Suivant
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}