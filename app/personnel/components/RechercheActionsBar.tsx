"use client";

import { Box, Button, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";

type Props = {
  total: number;
  loading?: boolean;

  selectedCount: number;

  onExport: () => void | Promise<void>;
  onOpenBulkAll: () => void;
  onOpenBulkSelected: () => void;
};

export default function RechercheActionsBar({
  total,
  loading,
  selectedCount,
  onExport,
  onOpenBulkAll,
  onOpenBulkSelected,
}: Props) {
  const disabled = loading || total === 0;
  const disableSelected = loading || selectedCount === 0;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2,
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {loading
          ? "Chargement..."
          : `${total} résultat(s)${
              selectedCount > 0 ? ` — ${selectedCount} sélectionné(s)` : ""
            }`}
      </Typography>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          disabled={disabled}
          onClick={onExport}
        >
          Exporter
        </Button>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<EventAvailableIcon />}
          disabled={disabled}
          onClick={onOpenBulkAll}
        >
          Convocations (tout)
        </Button>

        <Button
          variant="contained"
          color="primary"
          startIcon={<EventAvailableIcon />}
          disabled={disableSelected}
          onClick={onOpenBulkSelected}
        >
          Convocations (sélection)
        </Button>
      </Box>
    </Box>
  );
}
