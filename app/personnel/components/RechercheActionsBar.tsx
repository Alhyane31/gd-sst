"use client";

import { Box, Button, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";

type Props = {
  total: number;
  loading?: boolean;
  onExport: () => void;
  onOpenBulk: () => void;
};

export default function RechercheActionsBar({ total, loading, onExport, onOpenBulk }: Props) {
  const disabled = loading || total === 0;

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {loading ? "Chargement..." : `${total} résultat(s)`}
      </Typography>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <Button variant="outlined" startIcon={<DownloadIcon />} disabled={disabled} onClick={onExport}>
          Exporter le résultat
        </Button>

        <Button variant="contained" color="secondary" startIcon={<EventAvailableIcon />} disabled={disabled} onClick={onOpenBulk}>
          Générer convocations (tout)
        </Button>
      </Box>
    </Box>
  );
}
