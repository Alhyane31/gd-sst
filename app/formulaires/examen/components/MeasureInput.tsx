"use client";

// Champ numérique avec unité, bornes min/max, entier ou décimal, et valeurs usuelles en aide.
import { InputAdornment, TextField } from "@mui/material";
import { validerMesure, type RegleMesure } from "@/lib/clinique/mesures";

export default function MeasureInput({
  label,
  unit,
  value,
  onChange,
  help,
  readOnly = false,
  width = 240,
  ...regle
}: RegleMesure & {
  label: string;
  unit?: string;
  value: unknown;
  onChange: (v: string) => void;
  help?: string;
  readOnly?: boolean;
  width?: number | string;
}) {
  const text = value === undefined || value === null ? "" : String(value);
  const error = validerMesure(text, regle);

  return (
    <TextField
      size="small"
      label={label}
      value={text}
      disabled={readOnly}
      // chiffres, virgule/point décimal et signe uniquement
      onChange={(e) => onChange(e.target.value.replace(/[^\d.,-]/g, ""))}
      error={!!error}
      helperText={error ?? help}
      sx={{ width }}
      slotProps={{
        htmlInput: { inputMode: regle.integer ? "numeric" : "decimal" },
        input: unit ? { endAdornment: <InputAdornment position="end">{unit}</InputAdornment> } : undefined,
      }}
    />
  );
}
