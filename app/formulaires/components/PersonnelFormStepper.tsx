"use client";

import {
  Alert,
  Box, Paper, Stepper, Step, StepLabel,
  Button, Typography, LinearProgress,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useEffect, useMemo, useState } from "react";
import type { FormData, ChangeHandler } from "./types";

import InformationsGeneralesSection from "./sections/InformationsGeneralesSection";
import InformationsProfessionnellesSection from "./sections/InformationsProfessionnellesSection";
import RenseignementsProfessionnelsSection from "./sections/RenseignementsProfessionnelsSection";
import ActivitesContraintesProfessionnellesSection from "./sections/ActivitesContraintesProfessionnellesSection";
import AntecedentsSection from "./sections/AntecedentsSection";
import ExamenCliniqueAptitudeSection from "./sections/ExamenCliniqueAptitudeSection";
import SuiviRapprocheSection from "./sections/SuiviRapprocheSection";
import CertificatMedicalSection from "./sections/CertificatMedicalSection";
import IdentificationExpertiseSection from "./sections/IdentificationExpertiseSection";
import ResultatExpertiseSection from "./sections/ResultatExpertiseSection";
import { getSectionsForVisiteType } from "../visiteSectionsConfig";

type Props = {
  mode: "create" | "edit";
  readOnly?: boolean;
  initialData: FormData;
  title?: string;
  saving?: boolean;
  validateLabel?: string;
  categoriePersonnel: string;
  formulaireStatut?: "DRAFT" | "SUBMITTED" | "VERIFIED" | "";
  onSave: (data: FormData) => Promise<void> | void;
  onSubmit: (data: FormData) => Promise<void> | void;
};

export default function PersonnelFormStepper({
  mode,
  readOnly = false,
  initialData,
  categoriePersonnel,
  title,
  saving = false,
  validateLabel = "Valider",
  onSave,
  onSubmit,
}: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialData);

  useEffect(() => {
    setFormData(initialData);
    setActiveStep(0);
  }, [initialData]);

  const steps = useMemo(
    () => getSectionsForVisiteType(formData.typeVisite),
    [formData.typeVisite]
  );

  const stepKey = useMemo(() => steps[activeStep]?.key, [activeStep, steps]);

  const onFieldChange: ChangeHandler = (name, value) => {
    if (readOnly) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  const handleBack = () => setActiveStep((prev) => Math.max(prev - 1, 0));
  const handleSave   = async () => await onSave(formData);
  const handleSubmit = async () => await onSubmit(formData);

  const isLastStep = activeStep === steps.length - 1;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", px: "0.5cm", pt: 2, pb: 2 }}>
      <Typography variant="h5" mb={2} fontWeight={600}>
        {title ?? (mode === "edit" ? "Éditer le formulaire de visite" : "Nouveau formulaire de visite")}
      </Typography>

      {readOnly && (
        <Alert
          severity="warning"
          icon={<LockOutlinedIcon fontSize="inherit" />}
          sx={{ mb: 2 }}
        >
          Visite clôturée — formulaire en lecture seule, les modifications ne sont pas possibles.
        </Alert>
      )}

      {saving && <LinearProgress sx={{ mb: 2 }} />}

      <Box display="flex" gap={2} alignItems="flex-start" flex={1} minHeight={0}>
        {/* Sidebar */}
        <Box sx={{ width: 180, flexShrink: 0, position: "sticky", top: 16 }}>
          <Stepper activeStep={activeStep} orientation="vertical" nonLinear>
            {steps.map((s, index) => (
              <Step key={s.key}>
                <StepLabel
                  onClick={() => setActiveStep(index)}
                  sx={{
                    cursor: "pointer",
                    "& .MuiStepLabel-label": {
                      fontSize: "0.78rem",
                      fontWeight: activeStep === index ? 700 : 400,
                      whiteSpace: "normal",
                      lineHeight: 1.3,
                    },
                  }}
                >
                  {s.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Contenu principal */}
        <Paper sx={{ p: 2, flex: 1, minWidth: 0 }} elevation={2}>
          {stepKey === "INFORMATIONS_GENERALES" && (
            <InformationsGeneralesSection data={formData} onChange={onFieldChange} categoriePersonnel={categoriePersonnel} />
          )}
          {stepKey === "INFORMATIONS_PROFESSIONNELLES" && (
            <InformationsProfessionnellesSection data={formData} onChange={onFieldChange} />
          )}
          {stepKey === "RENSEIGNEMENTS_PROFESSIONNELS" && (
            <RenseignementsProfessionnelsSection data={formData} onChange={onFieldChange} />
          )}
          {stepKey === "ACTIVITES_CONTRAINTES_PROFESSIONNELLES" && (
            <ActivitesContraintesProfessionnellesSection data={formData} onChange={onFieldChange} />
          )}
          {stepKey === "ANTECEDENTS" && (
            <AntecedentsSection data={formData} onChange={onFieldChange} />
          )}
          {stepKey === "EXAMEN_CLINIQUE_APTITUDE" && (
            <ExamenCliniqueAptitudeSection data={formData} onChange={onFieldChange} />
          )}
          {stepKey === "SUIVI_RAPPROCHE" && (
            <SuiviRapprocheSection data={formData} onChange={onFieldChange} categoriePersonnel={categoriePersonnel} />
          )}
          {stepKey === "CERTIFICAT_MEDICALE" && (
            <CertificatMedicalSection data={formData} onChange={onFieldChange} />
          )}
          {stepKey === "IDENTIFICATION_EXPERTISE" && (
            <IdentificationExpertiseSection data={formData} onChange={onFieldChange} />
          )}
          {stepKey === "RESULTAT_EXPERTISE" && (
            <ResultatExpertiseSection data={formData} onChange={onFieldChange} />
          )}

          <Box mt={4} display="flex" justifyContent="space-between" alignItems="center">
            <Button disabled={activeStep === 0 || saving} onClick={handleBack}>
              Précédent
            </Button>

            <Box display="flex" gap={2}>
              {!readOnly && (
                <>
                  <Button variant="outlined" disabled={saving} onClick={handleSave}>
                    Enregistrer
                  </Button>

                  {isLastStep ? (
                    <Button variant="contained" disabled={saving} onClick={handleSubmit}>
                      {validateLabel}
                    </Button>
                  ) : (
                    <Button variant="contained" disabled={saving} onClick={handleNext}>
                      Suivant
                    </Button>
                  )}
                </>
              )}

              {readOnly && !isLastStep && (
                <Button variant="contained" onClick={handleNext}>
                  Suivant
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
