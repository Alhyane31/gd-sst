"use client";

import { Box, Button, Menu, MenuItem, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useState } from "react";

type Props = {
  total: number;
  loading?: boolean;
  selectedCount: number;
  onExport: () => void | Promise<void>;
  onOpenBulkAll: () => void;
  onOpenBulkSelected: () => void;
  onCreatePersonnel: () => void;
  onImportPersonnel: () => void;
  onImportRadiation: () => void;
};

export default function RechercheActionsBar({
  total, loading, selectedCount,
  onExport, onOpenBulkAll, onOpenBulkSelected,
  onCreatePersonnel, onImportPersonnel, onImportRadiation,
}: Props) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const disabled         = loading || total === 0;
  const disableSelected  = loading || selectedCount === 0;

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {loading
          ? "Chargement..."
          : `${total} résultat(s)${selectedCount > 0 ? ` — ${selectedCount} sélectionné(s)` : ""}`}
      </Typography>

      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={onCreatePersonnel}>
          Nouveau personnel
        </Button>

        <Button variant="outlined" startIcon={<DownloadIcon />} disabled={disabled} onClick={onExport}>
          Exporter
        </Button>

        <Button variant="contained" color="secondary" startIcon={<EventAvailableIcon />} disabled={disabled} onClick={onOpenBulkAll}>
          Convocations (tout)
        </Button>

        <Button variant="contained" color="primary" startIcon={<EventAvailableIcon />} disabled={disableSelected} onClick={onOpenBulkSelected}>
          Convocations (sélection)
        </Button>

        {/* Actions en masse */}
        <Button
          variant="outlined"
          color="warning"
          endIcon={<MoreVertIcon />}
          onClick={(e) => setAnchor(e.currentTarget)}
        >
          Actions en masse
        </Button>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
          <MenuItem onClick={() => { setAnchor(null); onImportPersonnel(); }}>
            Importer du personnel (CSV)
          </MenuItem>
          <MenuItem onClick={() => { setAnchor(null); onImportRadiation(); }}>
            Importer des radiations (CSV)
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
