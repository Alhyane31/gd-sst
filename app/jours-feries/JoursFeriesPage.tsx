"use client";

import {
  Box, Button, IconButton, Paper, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Typography, Alert, CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";

type JourFerie = { id: string; date: string; label: string | null };

export default function JoursFeriesPage() {
  const [rows, setRows]       = useState<JourFerie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const [newDate, setNewDate]   = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding]     = useState(false);
  const [addError, setAddError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jours-feries");
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newDate) { setAddError("La date est obligatoire."); return; }
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch("/api/jours-feries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate, label: newLabel }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data?.error ?? "Erreur"); return; }
      setNewDate("");
      setNewLabel("");
      await load();
    } catch {
      setAddError("Erreur serveur");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce jour férié ?")) return;
    await fetch(`/api/jours-feries/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <Box>
      <Typography variant="h5" mb={3}>Jours fériés</Typography>

      {/* Formulaire d'ajout */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={2}>Ajouter un jour férié</Typography>
        {addError && <Alert severity="error" sx={{ mb: 2 }}>{addError}</Alert>}
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="flex-start">
          <TextField
            type="date"
            label="Date"
            size="small"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 200 }}
          />
          <TextField
            label="Libellé (optionnel)"
            size="small"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Ex : Fête du Travail"
            sx={{ width: 280 }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            disabled={adding}
          >
            {adding ? "Ajout..." : "Ajouter"}
          </Button>
        </Box>
      </Paper>

      {/* Tableau */}
      <Paper>
        {loading ? (
          <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        ) : rows.length === 0 ? (
          <Typography p={3} color="text.secondary">Aucun jour férié enregistré.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Libellé</TableCell>
                <TableCell align="center">Supprimer</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{dayjs(r.date).format("DD/MM/YYYY")}</TableCell>
                  <TableCell>{r.label ?? <em style={{ color: "#999" }}>—</em>}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}
