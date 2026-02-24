"use client";

import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  LinearProgress,
} from "@mui/material";
import { useMemo, useState } from "react";
import type { FormData, FormSectionKey, ChangeHandler } from "./types";

import InformationsGeneralesSection from "./sections/InformationsGeneralesSection";
import InformationsProfessionnellesSection from "./sections/InformationsProfessionnellesSection";
import RenseignementsProfessionnelsSection from "./sections/RenseignementsProfessionnelsSection";
import AntecedentsSection from "./sections/AntecedentsSection";

const steps: { key: FormSectionKey; label: string }[] = [
  { key: "INFORMATIONS_GENERALES", label: "Informations générales" },
  { key: "INFORMATIONS_PROFESSIONNELLES", label: "Informations professionnelles" },
  { key: "RENSEIGNEMENTS_PROFESSIONNELS", label: "Renseignements professionnels" },
  { key: "ANTECEDENTS", label: "Antécédents" },
];

type Props = {
  mode: "create" | "edit";
  initialData: FormData;
  title?: string;
  saving?: boolean;
  onSubmit: (data: FormData) => Promise<void> | void;
};

export default function PersonnelFormStepper({
  mode,
  initialData,
  title,
  saving,
  onSubmit,
}: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialData);

  const stepKey = useMemo(() => steps[activeStep]?.key, [activeStep]);

  const onFieldChange: ChangeHandler = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  const handleBack = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    await onSubmit(formData);
  };

  return (
    <Box p={4}>
      <Typography variant="h4" mb={3}>
        {title ?? (mode === "edit" ? "Éditer le formulaire de visite" : "Nouveau formulaire de visite")}
      </Typography>

      {saving ? <LinearProgress sx={{ mb: 2 }} /> : null}

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

        {stepKey === "ANTECEDENTS" && <AntecedentsSection data={formData} onChange={onFieldChange} />}

        <Box mt={4} display="flex" justifyContent="space-between">
          <Button disabled={activeStep === 0 || saving} onClick={handleBack}>
            Précédent
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button variant="contained" disabled={saving} onClick={handleSubmit}>
              Enregistrer
            </Button>
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