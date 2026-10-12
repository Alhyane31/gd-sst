"use client";

import { Alert, Box, Divider, TextField, Typography } from "@mui/material";
import ExamenAccordions from "@/app/formulaires/examen/components/ExamenAccordions";
import { EXAMEN_CLINIQUE } from "@/app/formulaires/examen/config/examenClinique";
import type { ExamCtx } from "@/app/formulaires/examen/types";
import type { ChangeHandler, FormData } from "../types";

export default function ExamenCliniqueAptitudeSection({
  data,
  onChange,
  ctx,
}: {
  data: FormData;
  onChange: ChangeHandler;
  ctx: ExamCtx;
}) {
  const readOnly = !!ctx.readOnly;

  return (
    <Box>
      <Typography variant="h6" mb={1}>
        Examen clinique
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Examen structuré par appareil. Pour chaque région : inspection, palpation, mobilité, tests, puis neurologique.
        Les grilles ne sont pas obligatoires.
      </Typography>

      {/* Dossiers saisis avant l'examen structuré : texte libre conservé en lecture seule */}
      {data.examenCliniqueComplet?.trim() && (
        <Alert severity="info" sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
          <strong>Examen clinique (ancien format) :</strong>
          <br />
          {data.examenCliniqueComplet}
        </Alert>
      )}

      <ExamenAccordions
        groupes={EXAMEN_CLINIQUE}
        champPrefix="examen"
        ctx={ctx}
        values={data.examen}
        onChange={(next) => onChange("examen", { ...(data.examen ?? {}), ...next })}
      />

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" mb={1}>
        Si examens paracliniques demandés, veuillez les indiquer avec résultats et interprétation
      </Typography>
      <TextField
        fullWidth
        multiline
        minRows={4}
        disabled={readOnly}
        value={data.examensPracliniques}
        onChange={(e) => onChange("examensPracliniques", e.target.value)}
      />

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" mb={2}>
        Conclusion de la consultation médicale
      </Typography>

      <Typography variant="subtitle1" mb={1}>
        Diagnostic(s) antérieur(s) (antécédents)
      </Typography>
      <TextField
        fullWidth
        multiline
        minRows={3}
        disabled={readOnly}
        value={data.diagnosticsAnterieurs}
        onChange={(e) => onChange("diagnosticsAnterieurs", e.target.value)}
      />

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" mb={1}>
        Maladie(s) découverte(s) à l&apos;issue de l&apos;examen clinique de ce jour
      </Typography>
      <TextField
        fullWidth
        multiline
        minRows={3}
        disabled={readOnly}
        value={data.maladiesDecouvertes}
        onChange={(e) => onChange("maladiesDecouvertes", e.target.value)}
      />

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" mb={1}>
        Diagnostic(s) suspecté(s)
      </Typography>
      <TextField
        fullWidth
        multiline
        minRows={3}
        disabled={readOnly}
        value={data.diagnosticsSuspectes}
        onChange={(e) => onChange("diagnosticsSuspectes", e.target.value)}
      />
    </Box>
  );
}
