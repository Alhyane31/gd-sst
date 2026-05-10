"use client";

import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, Paper, Stack, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import { useCallback, useEffect, useState } from "react";

type Formation = { id: string; code: string; libelle: string; _count: { services: number; personnels: number } };

const EMPTY_FORM = { code: "", libelle: "" };

export default function FormationsPage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Formation | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetch("/api/formations").then((r) => r.json());
      setFormations(Array.isArray(data) ? data : []);
    } catch {
      setError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    const esc = (v: any) => { const s = String(v ?? ""); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const lines = [
      "code;libelle;nbServices;nbPersonnel",
      ...formations.map((f) => [esc(f.code), esc(f.libelle), esc(f._count.services), esc(f._count.personnels)].join(";")),
    ];
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `formations_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setOpen(true);
  };

  const openEdit = (f: Formation) => {
    setEditing(f);
    setForm({ code: f.code, libelle: f.libelle });
    setFormError("");
    setOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!form.code || !form.libelle) { setFormError("Code et libellé sont obligatoires"); return; }
    setSaving(true);
    try {
      const res = editing
        ? await fetch(`/api/formations/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
        : await fetch("/api/formations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Erreur"); return; }
      setOpen(false);
      await load();
    } catch {
      setFormError("Erreur serveur");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (f: Formation) => {
    if (f._count.services > 0 || f._count.personnels > 0) {
      alert(`Cette formation contient ${f._count.services} service(s) et ${f._count.personnels} personnel(s). Impossible de supprimer.`);
      return;
    }
    if (!confirm(`Supprimer la formation "${f.libelle}" ?`)) return;
    const res = await fetch(`/api/formations/${f.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    await load();
  };

  return (
    <Box p={4}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Référentiel — Formations</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportCsv} disabled={formations.length === 0}>
            Exporter
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Nouvelle formation</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper>
        {loading ? (
          <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "background.default" }}>
                <TableCell>Code</TableCell>
                <TableCell>Libellé</TableCell>
                <TableCell>Services</TableCell>
                <TableCell>Personnel</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formations.map((f) => (
                <TableRow key={f.id} hover>
                  <TableCell><Chip label={f.code} size="small" variant="outlined" sx={{ fontFamily: "monospace" }} /></TableCell>
                  <TableCell><Typography fontWeight={500}>{f.libelle}</Typography></TableCell>
                  <TableCell><Chip label={f._count.services} size="small" color={f._count.services > 0 ? "primary" : "default"} /></TableCell>
                  <TableCell><Chip label={f._count.personnels} size="small" color={f._count.personnels > 0 ? "info" : "default"} /></TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="Modifier"><IconButton size="small" onClick={() => openEdit(f)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => handleDelete(f)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Modifier la formation" : "Nouvelle formation"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField label="Code" size="small" fullWidth value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
            <TextField label="Libellé" size="small" fullWidth value={form.libelle} onChange={(e) => setForm((f) => ({ ...f, libelle: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
