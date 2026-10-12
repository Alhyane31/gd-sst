"use client";

// Mobilités articulaires en degrés : actif/passif × D/G, ou actif seul (D/G si bilatéral).
import { Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { validerMesure } from "@/lib/clinique/mesures";
import type { Movement } from "../types";

export type MobilityValue = Record<string, Record<string, string>>;

const COLS_ACTIF_PASSIF = [
  { key: "AD", label: "Actif D" },
  { key: "AG", label: "Actif G" },
  { key: "PD", label: "Passif D" },
  { key: "PG", label: "Passif G" },
];

export default function MobilityTable({
  label,
  movements,
  mode = "actif-passif",
  max = 180,
  value,
  onChange,
  readOnly = false,
}: {
  label?: string;
  movements: Movement[];
  mode?: "actif-passif" | "actif";
  max?: number;
  value: MobilityValue | undefined;
  onChange: (next: MobilityValue) => void;
  readOnly?: boolean;
}) {
  const current = value ?? {};
  const cols = mode === "actif-passif" ? COLS_ACTIF_PASSIF : [{ key: "D", label: "Droite" }, { key: "G", label: "Gauche" }];

  const setCell = (mov: string, col: string, v: string) => {
    const row = { ...(current[mov] ?? {}) };
    const clean = v.replace(/[^\d]/g, "");
    if (clean === "") delete row[col];
    else row[col] = clean;
    onChange({ ...current, [mov]: row });
  };

  const cell = (mov: Movement, col: string) => {
    const v = current[mov.id]?.[col] ?? "";
    const err = validerMesure(v, { min: 0, max, integer: true });
    return (
      <TextField
        size="small"
        value={v}
        disabled={readOnly}
        error={!!err}
        title={err ?? undefined}
        onChange={(e) => setCell(mov.id, col, e.target.value)}
        sx={{ width: 76 }}
        slotProps={{ htmlInput: { inputMode: "numeric", "aria-label": `${mov.label} ${col}` } }}
      />
    );
  };

  return (
    <div>
      {label && (
        <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
          {label} <Typography component="span" variant="caption" color="text.secondary">(degrés, 0–{max})</Typography>
        </Typography>
      )}
      <Paper variant="outlined" sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Mouvement</TableCell>
              <TableCell>Normale</TableCell>
              {cols.map((c) => (
                <TableCell key={c.key} align="center">
                  {c.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {movements.map((m) => (
              <TableRow key={m.id}>
                <TableCell sx={{ fontSize: "0.85rem" }}>{m.label}</TableCell>
                <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary", whiteSpace: "nowrap" }}>{m.normal ?? "—"}</TableCell>
                {mode === "actif" && !m.bilateral ? (
                  <TableCell colSpan={2} align="center">
                    {cell(m, "V")}
                  </TableCell>
                ) : (
                  cols.map((c) => (
                    <TableCell key={c.key} align="center">
                      {cell(m, c.key)}
                    </TableCell>
                  ))
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </div>
  );
}
