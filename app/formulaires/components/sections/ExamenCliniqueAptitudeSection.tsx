"use client";

import { Box, Divider, TextField, Typography } from "@mui/material";
import type { ChangeHandler, FormData } from "../types";

export default function ExamenCliniqueAptitudeSection({
  data,
  onChange,
}: {
  data: FormData;
  onChange: ChangeHandler;
}) {
  return (
    <Box>
      {/* Examen clinique et bilans paracliniques */}
      <Typography variant="h6" mb={2}>
        Examen clinique et bilans paracliniques
      </Typography>

      <Typography variant="subtitle1" mb={1}>
        Renseignez les données de l'examen clinique complet *
      </Typography>
      <TextField
        fullWidth
        required
        multiline
        minRows={5}
        value={data.examenCliniqueComplet}
        onChange={(e) => onChange("examenCliniqueComplet", e.target.value)}
      />

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" mb={1}>
        Si examens paracliniques demandés, veuillez les indiquer avec résultats et interprétation
      </Typography>
      <TextField
        fullWidth
        multiline
        minRows={4}
        value={data.examensPracliniques}
        onChange={(e) => onChange("examensPracliniques", e.target.value)}
      />

      <Divider sx={{ my: 3 }} />

      {/* Conclusion de la Consultation Médicale */}
      <Typography variant="h6" mb={2}>
        Conclusion de la Consultation Médicale
      </Typography>

      <Typography variant="subtitle1" mb={1}>
        Diagnostic(s) antérieur(s) (antécédents) *
      </Typography>
      <TextField
        fullWidth
        required
        multiline
        minRows={3}
        value={data.diagnosticsAnterieurs}
        onChange={(e) => onChange("diagnosticsAnterieurs", e.target.value)}
      />

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" mb={1}>
        Maladie(s) découverte(s) à l'issue de l'examen clinique de ce jour *
      </Typography>
      <TextField
        fullWidth
        required
        multiline
        minRows={3}
        value={data.maladiesDecouvertes}
        onChange={(e) => onChange("maladiesDecouvertes", e.target.value)}
      />

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" mb={1}>
        Diagnostic(s) suspecté(s) *
      </Typography>
      <TextField
        fullWidth
        required
        multiline
        minRows={3}
        value={data.diagnosticsSuspectes}
        onChange={(e) => onChange("diagnosticsSuspectes", e.target.value)}
      />
    </Box>
  );
}
