"use client";

import { Alert, Box, Typography } from "@mui/material";
import ExamenAccordions from "@/app/formulaires/examen/components/ExamenAccordions";
import { EXAMEN_PARACLINIQUE } from "@/app/formulaires/examen/config/paraclinique";
import type { ExamCtx } from "@/app/formulaires/examen/types";
import type { ChangeHandler, FormData } from "../types";

const TYPES_VISITE: Record<string, string> = {
  EMBAUCHE: "Embauche",
  ANNUELLE: "Périodique (annuelle)",
  RAPPROCHEE: "Périodique (rapprochée)",
  SPONTANNE: "Spontanée",
  CM: "Certificat médical",
  EXPERTISE: "Expertise",
  ETUDEP: "Étude de poste",
  LD: "Longue durée",
  MD: "Mi-durée",
  AUTRE: "Autre",
};

export default function ExamenParacliniqueSection({
  data,
  onChange,
  ctx,
}: {
  data: FormData;
  onChange: ChangeHandler;
  ctx: ExamCtx;
}) {
  return (
    <Box>
      <Typography variant="h6" mb={1}>
        Examen paraclinique
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Type de visite : <strong>{TYPES_VISITE[ctx.visiteType ?? ""] ?? "—"}</strong>. Les examens 5.1 à 5.5 concernent
        toutes les visites ; la visite d&apos;embauche ouvre en plus la radiographie thoracique et la NFS.
      </Typography>

      {/* Dossiers saisis avant le paraclinique structuré : texte libre conservé en lecture seule */}
      {data.examensPracliniques?.trim() && (
        <Alert severity="info" sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
          <strong>Examens paracliniques (ancien format) :</strong>
          <br />
          {data.examensPracliniques}
        </Alert>
      )}

      <ExamenAccordions
        groupes={EXAMEN_PARACLINIQUE}
        champPrefix="paraclinique"
        ctx={ctx}
        values={data.paraclinique}
        onChange={(next) => onChange("paraclinique", { ...(data.paraclinique ?? {}), ...next })}
      />
    </Box>
  );
}
