"use client";

import {
  Box,
  Button,
  Checkbox,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";

type ConvocationStatut =
  | "A_CONVOQUER"
  | "CONVOCATION_GENEREE"
  | "A_TRAITER"
  | "A_RELANCER"
  | "RELANCEE"
  | "REALISEE"
  | "ANNULEE";

type ConvocationMini = {
  id: string;
  statut: ConvocationStatut;
  convocationType?: string | null;
  datePrevue: string | null;
  personnel?: { firstName?: string | null; lastName?: string | null } | null;
};

export default function AvailableConvocationsTable({
  bordereauId,
  serviceId,
  disabled,
  onChanged,
}: {
  bordereauId: string;
  serviceId: string;
  disabled: boolean;
  onChanged: () => void;
}) {
  const [rows, setRows] = useState<ConvocationMini[]>([]);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState<string[]>([]);

  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState(""); // YYYY-MM-DD
  const [dateTo, setDateTo] = useState(""); // YYYY-MM-DD

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const name = `${r.personnel?.lastName ?? ""} ${r.personnel?.firstName ?? ""}`.toLowerCase();
      const okQ = q ? name.includes(q.toLowerCase()) : true;

      const d = r.datePrevue ? dayjs(r.datePrevue) : null;
      const okFrom = dateFrom ? (d ? d.isAfter(dayjs(dateFrom).startOf("day")) || d.isSame(dayjs(dateFrom).startOf("day")) : false) : true;
      const okTo = dateTo ? (d ? d.isBefore(dayjs(dateTo).endOf("day")) || d.isSame(dayjs(dateTo).endOf("day")) : false) : true;

      return okQ && okFrom && okTo;
    });
  }, [rows, q, dateFrom, dateTo]);

  const load = useCallback(async () => {
    if (!serviceId) {
      setRows([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("serviceId", serviceId);
      params.set("statut", "A_CONVOQUER");

      // ⚠️ IMPORTANT : pour exclure celles déjà attachées
      // -> côté API, idéalement: bordereauId=__null
      params.set("bordereauId", "__null");

      const res = await fetch(`/api/convocations?${params.toString()}`);
      if (!res.ok) {
        setRows([]);
        return;
      }
      const data = await res.json();
      const items: ConvocationMini[] = Array.isArray(data) ? data : data.items ?? [];
      setRows(items);
    } catch (e) {
      console.error("load available convocations error", e);
      setRows([]);
    } finally {
      setLoading(false);
      setSelected([]);
    }
  }, [serviceId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleOne = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    const ids = filtered.map((r) => r.id);
    const all = ids.length > 0 && ids.every((id) => selected.includes(id));
    setSelected((prev) => {
      if (all) return prev.filter((id) => !ids.includes(id));
      const set = new Set(prev);
      ids.forEach((id) => set.add(id));
      return Array.from(set);
    });
  };

  const handleAdd = async () => {
    if (disabled) return;
    if (selected.length === 0) return;

    const res = await fetch(`/api/bordereaux/${bordereauId}/convocations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ convocationIds: selected }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Erreur ajout");
      return;
    }

    await load();
    onChanged();
  };

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" alignItems="center">
          <TextField
            size="small"
            label="Recherche (nom/prénom)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ flexBasis: { xs: "100%", md: "40%" }, flexGrow: 1, minWidth: 240 }}
          />

          <TextField
            size="small"
            type="date"
            label="Date début"
            InputLabelProps={{ shrink: true }}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            sx={{ flexBasis: { xs: "100%", md: "20%" }, flexGrow: 1, minWidth: 200 }}
          />

          <TextField
            size="small"
            type="date"
            label="Date fin"
            InputLabelProps={{ shrink: true }}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            sx={{ flexBasis: { xs: "100%", md: "20%" }, flexGrow: 1, minWidth: 200 }}
          />

          <Box sx={{ flexBasis: { xs: "100%", md: "20%" }, flexGrow: 1, minWidth: 200, display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button variant="outlined" onClick={load} disabled={loading}>
              Rafraîchir
            </Button>
            <Button variant="contained" onClick={handleAdd} disabled={disabled || selected.length === 0}>
              Ajouter ({selected.length})
            </Button>
          </Box>
        </Stack>
      </Paper>

      {loading ? (
        <Typography color="text.secondary">Chargement...</Typography>
      ) : filtered.length === 0 ? (
        <Typography color="text.secondary">Aucune convocation disponible.</Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={filtered.length > 0 && filtered.every((r) => selected.includes(r.id))}
                  indeterminate={
                    filtered.some((r) => selected.includes(r.id)) &&
                    !filtered.every((r) => selected.includes(r.id))
                  }
                  onChange={toggleAll}
                />
              </TableCell>
              <TableCell>Personnel</TableCell>
              <TableCell>Date prévue</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Statut</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((r) => {
              const name = `${r.personnel?.lastName ?? ""} ${r.personnel?.firstName ?? ""}`.trim() || "-";
              const date = r.datePrevue ? dayjs(r.datePrevue).format("DD/MM/YYYY HH:mm") : "-";
              return (
                <TableRow key={r.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selected.includes(r.id)} onChange={() => toggleOne(r.id)} />
                  </TableCell>
                  <TableCell>{name}</TableCell>
                  <TableCell>{date}</TableCell>
                  <TableCell>{r.convocationType ?? "-"}</TableCell>
                  <TableCell>
                    <Chip size="small" label={r.statut} variant="outlined" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}
