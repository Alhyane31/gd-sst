"use client";

// Échelle visuelle analogique 0–10 (non obligatoire : recliquer efface).
import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";

const COULEURS = ["#2e7d32", "#43a047", "#7cb342", "#c0ca33", "#fdd835", "#ffb300", "#fb8c00", "#f4511e", "#e53935", "#c62828", "#8e0000"];

export default function EvaScale({
  label,
  value,
  onChange,
  readOnly = false,
}: {
  label: string;
  value: unknown;
  onChange: (v: number | undefined) => void;
  readOnly?: boolean;
}) {
  const current = typeof value === "number" ? value : null;

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
        {label}{" "}
        <Typography component="span" variant="caption" color="text.secondary">
          {current === null ? "(non renseignée)" : `: ${current}/10`}
        </Typography>
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={current}
        disabled={readOnly}
        onChange={(_, v: number | null) => onChange(v ?? undefined)}
        aria-label={label}
      >
        {Array.from({ length: 11 }, (_, i) => (
          <ToggleButton
            key={i}
            value={i}
            sx={{ width: 36, "&.Mui-selected, &.Mui-selected:hover": { bgcolor: COULEURS[i], color: "#fff" } }}
          >
            {i}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Box sx={{ display: "flex", justifyContent: "space-between", width: 11 * 36, mt: 0.25 }}>
        <Typography variant="caption" color="text.secondary">Aucune douleur</Typography>
        <Typography variant="caption" color="text.secondary">Douleur maximale</Typography>
      </Box>
    </Box>
  );
}
