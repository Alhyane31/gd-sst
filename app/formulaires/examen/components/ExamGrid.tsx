"use client";

// Grille d'examen réutilisable : lignes = items, colonnes = options (D/G, Normal/Anormal...).
// Une réponse par ligne, non obligatoire : recliquer sur la réponse cochée l'efface.
import {
  Box,
  Button,
  Paper,
  Radio,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { Option } from "../types";

export type GridValue = Record<string, string>;

export default function ExamGrid({
  label,
  rows,
  columns,
  value,
  onChange,
  readOnly = false,
  help,
}: {
  label?: string;
  rows: Option[];
  columns: Option[];
  value: GridValue | undefined;
  onChange: (next: GridValue) => void;
  readOnly?: boolean;
  help?: string;
}) {
  const current = value ?? {};
  const normal = columns.find((c) => c.normal);

  const setCell = (row: string, col: string) => {
    const next = { ...current };
    if (next[row] === col) delete next[row];
    else next[row] = col;
    onChange(next);
  };

  const setAll = (col: string) => {
    const next: GridValue = {};
    for (const r of rows) next[r.value] = col;
    onChange(next);
  };

  return (
    <Box>
      {(label || normal) && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
          {label && (
            <Typography variant="subtitle2" fontWeight={600}>
              {label}
            </Typography>
          )}
          {normal && !readOnly && (
            <Box>
              <Button size="small" onClick={() => setAll(normal.value)}>
                Tout « {normal.label} »
              </Button>
              {Object.keys(current).length > 0 && (
                <Button size="small" color="inherit" onClick={() => onChange({})}>
                  Effacer
                </Button>
              )}
            </Box>
          )}
        </Box>
      )}

      <Paper variant="outlined" sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell />
              {columns.map((c) => (
                <TableCell key={c.value} align="center" sx={{ fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {c.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => {
              const v = current[r.value];
              const anormal = !!v && v !== "NON_FAIT" && !!normal && !columns.find((c) => c.value === v)?.normal;
              return (
                <TableRow key={r.value} hover sx={anormal ? { bgcolor: "warning.50", "& td:first-of-type": { color: "warning.dark", fontWeight: 600 } } : undefined}>
                  <TableCell sx={{ fontSize: "0.85rem" }}>{r.label}</TableCell>
                  {columns.map((c) => (
                    <TableCell key={c.value} align="center" padding="none">
                      <Radio
                        size="small"
                        checked={v === c.value}
                        disabled={readOnly}
                        onClick={() => setCell(r.value, c.value)}
                        inputProps={{ "aria-label": `${r.label} — ${c.label}` }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {help && (
        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
          {help}
        </Typography>
      )}
    </Box>
  );
}
