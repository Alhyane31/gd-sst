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
import ParcoursAcademiqueSection from "./sections/ParcoursAcademiqueSection";
import InformationsProfessionnellesSection from "./sections/InformationsProfessionnellesSection";
import RenseignementsProfessionnelsSection from "./sections/RenseignementsProfessionnelsSection";
import ActivitesContraintesProfessionnellesSection from "./sections/ActivitesContraintesProfessionnellesSection";
import AntecedentsSection from "./sections/AntecedentsSection";
import ExamenCliniqueAptitudeSection from "./sections/ExamenCliniqueAptitudeSection";
import SuiviRapprocheSection from "./sections/SuiviRapprocheSection";
import CertificatMedicalSection from "./sections/CertificatMedicalSection";
import IdentificationExpertiseSection from "./sections/IdentificationExpertiseSection";
import ResultatExpertiseSection from "./sections/ResultatExpertiseSection";
import ConstantesSection from "./sections/ConstantesSection";
import ExamenParacliniqueSection from "./sections/ExamenParacliniqueSection";
import type { ExamCtx } from "../examen/types";
import { AES_SECTION_PAR_ETAPE, getVisibleSections } from "../visiteSectionsConfig";
import { AesCalendrierStep, AesConsultationsStep, AesDeclarationStep, useDossierAes } from "./sections/AesSections";
import { contexteAes } from "@/lib/aes/contexte";
import { REFERENTIEL_AES_DEFAUT } from "@/lib/aes/referentiel";
import { libellesManquants, manquantsDeclaration, type Manquants } from "@/app/aes/validation";
import AnnexesDrawer, { type CleAnnexe } from "@/app/aes/components/AnnexesDrawer";
import MenuBookIcon from "@mui/icons-material/MenuBook";

/** Annexes utiles par étape AES (mises en avant dans le panneau) */
const ANNEXES_PAR_ETAPE: Partial<Record<string, CleAnnexe[]>> = {
  AES_SOURCE: ["B", "C"],
  AES_VHB: ["C", "D"],
  AES_PRISE_EN_CHARGE: ["A", "B", "C"],
  AES_CALENDRIER: ["E", "F"],
  AES_CONSULTATIONS: ["E", "F", "G"],
};

type Props = {
  mode: "create" | "edit";
  readOnly?: boolean;
  initialData: FormData;
  /** id de la visite : pièces jointes */
  visiteId?: string;
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
  visiteId,
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

  // étapes du type de visite ; sections conditionnelles filtrées (ex. AES : plaie ou projection)
  const steps = useMemo(() => getVisibleSections(formData), [formData]);

  // étape courante bornée : une section conditionnelle peut disparaître
  const currentStep = Math.min(activeStep, Math.max(steps.length - 1, 0));
  const stepKey = steps[currentStep]?.key;

  // ── Visite AES ──────────────────────────────────────────────────────────────
  const estAes = formData.typeVisite === "AES";
  const { dossier: dossierAes, recharger: rechargerAes, majDeclaration: majDeclarationAes } = useDossierAes(visiteId, estAes);
  const declarationAes = dossierAes?.declaration ?? null;
  const referentielAes = dossierAes?.referentiel ?? REFERENTIEL_AES_DEFAUT;
  // panneau des annexes (consultable pendant la saisie)
  const [annexesOuvertes, setAnnexesOuvertes] = useState(false);
  const [annexe, setAnnexe] = useState<CleAnnexe>("A");
  const annexesUtiles = (stepKey && ANNEXES_PAR_ETAPE[stepKey]) || [];
  const ouvrirAnnexe = (cle?: string) => {
    setAnnexe((cle as CleAnnexe) ?? annexesUtiles[0] ?? "A");
    setAnnexesOuvertes(true);
  };

  const aesCtx = useMemo(
    () => ({
      ...contexteAes(declarationAes, referentielAes, readOnly || declarationAes?.statut === "CLOTUREE"),
      onAide: (cle: string) => {
        setAnnexe(cle as CleAnnexe);
        setAnnexesOuvertes(true);
      },
    }),
    [declarationAes, referentielAes, readOnly]
  );
  const [aesManquants, setAesManquants] = useState<Manquants>({});
  const [aesErreur, setAesErreur] = useState("");

  /** Champs obligatoires AES : bloque la validation et ouvre la première étape incomplète */
  const controlerAes = (): boolean => {
    const m = manquantsDeclaration(formData.aes ?? {}, aesCtx);
    setAesManquants(m);
    if (Object.keys(m).length === 0) {
      setAesErreur("");
      return true;
    }
    setAesErreur(`AES — champs obligatoires manquants : ${libellesManquants(m).join(", ")}`);
    const premiere = steps.findIndex((st) => {
      const sid = AES_SECTION_PAR_ETAPE[st.key];
      return sid !== undefined && m[sid]?.length;
    });
    if (premiere >= 0) setActiveStep(premiere);
    return false;
  };

  /** Valide la déclaration AES sans quitter le formulaire (génère le calendrier de suivi) */
  const validerAes = async () => {
    if (!controlerAes()) return;
    await onSave({ ...formData, aesAction: "valider" } as FormData);
    await rechargerAes();
  };

  // contexte des examens structurés : conditions d'affichage et alertes
  const examCtx: ExamCtx = {
    visiteId,
    visiteType: formData.typeVisite,
    sexe: formData.sexe,
    posteCode: formData.posteCode,
    readOnly,
  };

  const onFieldChange: ChangeHandler = (name, value) => {
    if (readOnly) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => setActiveStep(Math.min(currentStep + 1, steps.length - 1));
  const handleBack = () => setActiveStep(Math.max(currentStep - 1, 0));
  const handleSave = async () => {
    await onSave(formData);
    if (estAes) await rechargerAes();
  };
  const handleSubmit = async () => {
    if (estAes) {
      if (!controlerAes()) return;
      return onSubmit({ ...formData, aesAction: "valider" } as FormData);
    }
    return onSubmit(formData);
  };

  const isLastStep = currentStep === steps.length - 1;

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

      {estAes && aesErreur && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setAesErreur("")}>
          {aesErreur}
        </Alert>
      )}

      <Box display="flex" gap={2} alignItems="flex-start" flex={1} minHeight={0}>
        {/* Sidebar */}
        <Box sx={{ width: 180, flexShrink: 0, position: "sticky", top: 16 }}>
          <Stepper activeStep={currentStep} orientation="vertical" nonLinear>
            {steps.map((s, index) => (
              <Step key={s.key}>
                <StepLabel
                  onClick={() => setActiveStep(index)}
                  sx={{
                    cursor: "pointer",
                    "& .MuiStepLabel-label": {
                      fontSize: "0.78rem",
                      fontWeight: currentStep === index ? 700 : 400,
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
            <InformationsGeneralesSection data={formData} onChange={onFieldChange} categoriePersonnel={categoriePersonnel} readOnly={readOnly} />
          )}
          {stepKey === "PARCOURS_ACADEMIQUE" && (
            <ParcoursAcademiqueSection data={formData} onChange={onFieldChange} />
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
            <AntecedentsSection data={formData} onChange={onFieldChange} readOnly={readOnly} />
          )}
          {stepKey === "CONSTANTES" && (
            <ConstantesSection data={formData} onChange={onFieldChange} ctx={examCtx} />
          )}
          {stepKey === "EXAMEN_CLINIQUE_APTITUDE" && (
            <ExamenCliniqueAptitudeSection data={formData} onChange={onFieldChange} ctx={examCtx} />
          )}
          {stepKey === "EXAMEN_PARACLINIQUE" && (
            <ExamenParacliniqueSection data={formData} onChange={onFieldChange} ctx={examCtx} />
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

          {/* ── Visite AES ── */}
          {estAes && stepKey?.startsWith("AES_") && (
            <Box display="flex" justifyContent="flex-end" mb={1}>
              <Button size="small" variant="outlined" startIcon={<MenuBookIcon />} onClick={() => ouvrirAnnexe()}>
                Annexes{annexesUtiles.length ? ` (${annexesUtiles.join(", ")})` : ""}
              </Button>
            </Box>
          )}
          {stepKey && AES_SECTION_PAR_ETAPE[stepKey] && (
            <AesDeclarationStep
              sectionId={AES_SECTION_PAR_ETAPE[stepKey]!}
              values={formData.aes}
              onChange={(next) => onFieldChange("aes", next)}
              ctx={aesCtx}
              missing={aesManquants[AES_SECTION_PAR_ETAPE[stepKey]!]}
            />
          )}
          {stepKey === "AES_CALENDRIER" && visiteId && (
            <AesCalendrierStep
              visiteId={visiteId}
              declaration={declarationAes}
              onSaved={majDeclarationAes}
              onValider={validerAes}
              readOnly={readOnly}
            />
          )}
          {stepKey === "AES_CONSULTATIONS" && visiteId && (
            <AesConsultationsStep
              visiteId={visiteId}
              declaration={declarationAes}
              referentiel={referentielAes}
              onSaved={majDeclarationAes}
              onValider={validerAes}
              onAide={aesCtx.onAide}
              readOnly={readOnly}
            />
          )}
          {estAes && (
            <AnnexesDrawer
              open={annexesOuvertes}
              onClose={() => setAnnexesOuvertes(false)}
              referentiel={referentielAes}
              annexe={annexe}
              onAnnexe={setAnnexe}
              utiles={annexesUtiles}
            />
          )}

          <Box mt={4} display="flex" justifyContent="space-between" alignItems="center">
            <Button disabled={currentStep === 0 || saving} onClick={handleBack}>
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
