"use client";

import { Box, Button, Chip, Typography } from "@mui/material";
import dayjs from "dayjs";

type BordereauStatut = "NOUVEAU" | "GENERE";

export default function BordereauHeader({
  bordereau,
  onBack,
}: {
  bordereau: {
    serialNumber: string;
    statut: BordereauStatut;
    dateEdition: string | null;
    service: { libelle: string; formation?: { libelle: string } | null } | null;
  };
  onBack: () => void;
}) {
  const formation = bordereau.service?.formation?.libelle ?? "-";
  const service = bordereau.service?.libelle ?? "-";
  const dateEdition = bordereau.dateEdition ? dayjs(bordereau.dateEdition).format("DD/MM/YYYY") : "-";

  return (
    <Box mb={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h4">Détail Bordereau</Typography>
        <Button variant="outlined" onClick={onBack}>
          Retour
        </Button>
      </Box>

      <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
        <Typography>
          <b>Serial:</b> {bordereau.serialNumber}
        </Typography>

        <Chip
          size="small"
          label={bordereau.statut === "NOUVEAU" ? "Nouveau" : "Généré"}
          color={bordereau.statut === "NOUVEAU" ? "default" : "success"}
          variant="outlined"
        />

        <Typography sx={{ ml: 2 }}>
          <b>Formation:</b> {formation}
        </Typography>

        <Typography sx={{ ml: 2 }}>
          <b>Service:</b> {service}
        </Typography>

        <Typography sx={{ ml: 2 }}>
          <b>Date d’édition:</b> {dateEdition}
        </Typography>
      </Box>
    </Box>
  );
}
