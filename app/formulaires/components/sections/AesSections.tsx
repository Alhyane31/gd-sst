"use client";

// Étapes AES du formulaire de visite : déclaration (sections 1 à 9), calendrier de suivi, consultations.
// Les réponses de la déclaration font partie du formulaire (formData.aes, enregistrées avec lui) ;
// calendrier et consultations s'enregistrent par leurs propres boutons (suivi sur plusieurs semaines).
import { Alert, Box, Button, Divider, Stack, Typography } from "@mui/material";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import { useCallback, useEffect, useState } from "react";
import SectionRenderer from "@/app/formulaires/examen/components/SectionRenderer";
import type { ExamCtx, SectionValues } from "@/app/formulaires/examen/types";
import { DECLARATION_AES } from "@/app/aes/config/declaration";
import CalendrierSuivi from "@/app/aes/components/CalendrierSuivi";
import ClotureAes from "@/app/aes/components/ClotureAes";
import Consultations from "@/app/aes/components/Consultations";
import type { DeclarationApi, DossierAesApi } from "@/app/aes/types";
import type { ReferentielAes } from "@/lib/aes/referentiel";

/** Dossier AES de la visite (déclaration enregistrée, calendrier, consultations, référentiel) */
export function useDossierAes(visiteId: string | undefined, actif: boolean) {
  const [dossier, setDossier] = useState<DossierAesApi | null>(null);

  const charger = useCallback(
    () => (actif && visiteId ? fetch(`/api/aes/${visiteId}`).then((r) => (r.ok ? (r.json() as Promise<DossierAesApi>) : null)) : Promise.resolve(null)),
    [actif, visiteId]
  );

  useEffect(() => {
    let annule = false;
    charger().then((d) => {
      if (!annule && d) setDossier(d);
    });
    return () => {
      annule = true;
    };
  }, [charger]);

  const recharger = useCallback(async () => {
    const d = await charger();
    if (d) setDossier(d);
  }, [charger]);

  const majDeclaration = (d: DeclarationApi) => setDossier((x) => (x ? { ...x, declaration: d } : x));
  return { dossier, recharger, majDeclaration };
}

export function AesDeclarationStep({
  sectionId,
  values,
  onChange,
  ctx,
  missing,
}: {
  sectionId: string;
  values: SectionValues | undefined;
  onChange: (next: SectionValues) => void;
  ctx: ExamCtx;
  missing?: string[];
}) {
  const section = DECLARATION_AES.find((s) => s.id === sectionId);
  if (!section) return null;
  return (
    <Box>
      <Typography variant="h6" mb={1}>
        {section.title}
      </Typography>
      <SectionRenderer section={section} values={values} onChange={onChange} ctx={ctx} champPrefix="aes" missing={missing} />
    </Box>
  );
}

/** Déclaration pas encore validée : bouton de validation (contrôle des champs obligatoires) */
function DeclarationNonValidee({ onValider, readOnly }: { onValider: () => void; readOnly: boolean }) {
  return (
    <Alert
      severity="info"
      action={
        readOnly ? undefined : (
          <Button color="inherit" size="small" startIcon={<TaskAltIcon />} onClick={onValider}>
            Valider la déclaration AES
          </Button>
        )
      }
    >
      Le calendrier de suivi et les consultations de résultats sont disponibles après validation de la déclaration AES (champs
      obligatoires des sections AES).
    </Alert>
  );
}

export function AesCalendrierStep({
  visiteId,
  declaration,
  onSaved,
  onValider,
  readOnly,
}: {
  visiteId: string;
  declaration: DeclarationApi | null;
  onSaved: (d: DeclarationApi) => void;
  onValider: () => void;
  readOnly: boolean;
}) {
  return (
    <Box>
      <Typography variant="h6" mb={1}>
        AES – Calendrier de suivi
      </Typography>
      {!declaration || declaration.statut === "BROUILLON" ? (
        <DeclarationNonValidee onValider={onValider} readOnly={readOnly} />
      ) : (
        <CalendrierSuivi visiteId={visiteId} declaration={declaration} onSaved={onSaved} />
      )}
    </Box>
  );
}

export function AesConsultationsStep({
  visiteId,
  declaration,
  referentiel,
  onSaved,
  onValider,
  onAide,
  readOnly,
}: {
  visiteId: string;
  declaration: DeclarationApi | null;
  referentiel: ReferentielAes;
  onSaved: (d: DeclarationApi) => void;
  onValider: () => void;
  onAide?: (cle: string) => void;
  readOnly: boolean;
}) {
  return (
    <Box>
      <Typography variant="h6" mb={1}>
        AES – Consultations de résultats
      </Typography>
      {!declaration || declaration.statut === "BROUILLON" ? (
        <DeclarationNonValidee onValider={onValider} readOnly={readOnly} />
      ) : (
        <>
          <Consultations visiteId={visiteId} declaration={declaration} referentiel={referentiel} onSaved={onSaved} onAide={onAide} />
          {declaration.statut === "VALIDEE" && (
            <>
              <Divider sx={{ my: 3 }} />
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  Clôture du suivi : après la visite S12, ou après un arrêt justifié du suivi.
                </Typography>
                <ClotureAes visiteId={visiteId} declaration={declaration} onClosed={onSaved} />
              </Stack>
            </>
          )}
        </>
      )}
    </Box>
  );
}
