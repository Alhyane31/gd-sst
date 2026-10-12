"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box, Paper, Typography, CircularProgress, Divider,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from "@mui/material";

type RefItem = { id: string; libelle: string };

type EffectifsData = {
  formations: RefItem[];
  byPoste: { posteId: string; poste: string; formationId: string; formation: string; count: number }[];
};

export default function MatricePosteFormationPanel() {
  const [data, setData] = useState<EffectifsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/effectifs")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Impossible de charger les données."); setLoading(false); });
  }, []);

  const matrix = useMemo(() => {
    if (!data) return { rows: [], cols: [] as RefItem[] };
    const cols = data.formations;
    const rowMap = new Map<string, { poste: string; counts: Record<string, number>; total: number }>();
    for (const p of data.byPoste) {
      if (!rowMap.has(p.posteId)) rowMap.set(p.posteId, { poste: p.poste, counts: {}, total: 0 });
      const row = rowMap.get(p.posteId)!;
      row.counts[p.formationId] = (row.counts[p.formationId] ?? 0) + p.count;
      row.total += p.count;
    }
    const rows = [...rowMap.values()].sort((a, b) => b.total - a.total);
    return { rows, cols };
  }, [data]);

  if (loading) return <Box display="flex" justifyContent="center" p={8}><CircularProgress /></Box>;
  if (error || !data) return <Typography color="error" p={4}>{error || "Erreur"}</Typography>;

  const grandTotal = matrix.rows.reduce((sum, r) => sum + r.total, 0);

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={2}>Tableau croisé — Poste × Formation</Typography>
        <Divider sx={{ mb: 2 }} />
        {matrix.rows.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" mt={4}>Aucune donnée</Typography>
        ) : (
          <TableContainer sx={{ maxHeight: 640, overflowX: "auto" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Poste</TableCell>
                  {matrix.cols.map((c) => (
                    <TableCell key={c.id} align="right" sx={{ fontWeight: 700 }}>{c.libelle}</TableCell>
                  ))}
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {matrix.rows.map((row) => (
                  <TableRow key={row.poste} hover>
                    <TableCell>{row.poste}</TableCell>
                    {matrix.cols.map((c) => (
                      <TableCell key={c.id} align="right">{row.counts[c.id] ?? 0}</TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{row.total}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                  {matrix.cols.map((c) => (
                    <TableCell key={c.id} align="right" sx={{ fontWeight: 700 }}>
                      {matrix.rows.reduce((sum, r) => sum + (r.counts[c.id] ?? 0), 0)}
                    </TableCell>
                  ))}
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{grandTotal}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
