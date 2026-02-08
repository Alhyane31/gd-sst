"use client";

import {
  Box,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";

type ConvocationStatut =
  | "A_CONVOQUER"
  | "CONVOCATION_GENEREE"
  | "A_TRAITER"
  | "A_RELANCER"
  | "RELANCEE"
  | "REALISEE"
  | "ANNULEE";

type Row = {
  id: string;
  statut: ConvocationStatut;
  convocationType?: string | null;
  datePrevue: string | null;
  personnel?: { firstName?: string | null; lastName?: string | null } | null;
};

function dayKey(dateIso: string | null) {
  return dateIso ? dayjs(dateIso).format("YYYY-MM-DD") : "Sans date";
}

function dayLabel(dateIso: string | null) {
  return dateIso ? dayjs(dateIso).format("DD/MM/YYYY") : "Sans date";
}

export default function BordereauConvocationsTable({
  bordereauId,
  rows,
  canEdit,
  onChanged,
}: {
  bordereauId: string;
  rows: Row[];
  canEdit: boolean;
  onChanged: () => void;
}) {
  const groups = rows.reduce((acc, r) => {
    const k = dayKey(r.datePrevue);
    if (!acc[k]) acc[k] = [];
    acc[k].push(r);
    return acc;
  }, {} as Record<string, Row[]>);

  const handleRemove = async (convocationId: string) => {
    if (!canEdit) return;

     console.log("📤 handleRemove", { bordereauId, convocationId });

  const url = `/api/bordereaux/${bordereauId}/convocations`;
  console.log("🌐 DELETE URL =", url);
    const res = await fetch(`/api/bordereaux/${bordereauId}/convocations`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ convocationIds: [convocationId] }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Erreur retrait");
      return;
    }
    onChanged();
  };

  const keys = Object.keys(groups).sort((a, b) => a.localeCompare(b));

  if (rows.length === 0) {
    return <Typography color="text.secondary">Aucune convocation dans ce bordereau.</Typography>;
  }

  return (
    <Box>
      {keys.map((k) => {
        const list = groups[k];
        const label = k === "Sans date" ? "Sans date" : dayLabel(list[0]?.datePrevue ?? null);

        return (
          <Box key={k} sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography sx={{ fontWeight: 700 }}>
                {label} — {list.length} convocation(s)
              </Typography>
            </Box>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Personnel</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((r) => {
                  const last = r.personnel?.lastName ?? "";
                  const first = r.personnel?.firstName ?? "";
                  return (
                    <TableRow key={r.id} hover>
                      <TableCell>{`${last} ${first}`.trim() || "-"}</TableCell>
                      <TableCell>
                        <Chip size="small" label={r.statut} variant="outlined" />
                      </TableCell>
                      <TableCell>{r.convocationType ?? "-"}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          color="secondary"
                          disabled={!canEdit}
                          onClick={() => handleRemove(r.id)}
                        >
                          Retirer
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        );
      })}
    </Box>
  );
}
