"use client";

import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, IconButton, InputLabel,
  MenuItem, Paper, Select, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import DownloadIcon from "@mui/icons-material/Download";
import { useCallback, useEffect, useMemo, useState } from "react";

type Formation = { id: string; code: string; libelle: string };
type Service = { id: string; code: string; libelle: string; chefDeService: string | null; formation: Formation };

const EMPTY_FORM = { code: "", libelle: "", formationId: "", chefDeService: "" };

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // ── filtres ──
  const [q, setQ] = useState("");
  const [filterFormation, setFilterFormation] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, f] = await Promise.all([
        fetch("/api/services").then((r) => r.json()),
        fetch("/api/formations").then((r) => r.json()),
      ]);
      setServices(Array.isArray(s) ? s : []);
      setFormations(Array.isArray(f) ? f : []);
    } catch {
      setError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const search = q.toLowerCase();
    return services.filter((s) => {
      if (search &&
        !s.code.toLowerCase().includes(search) &&
        !s.libelle.toLowerCase().includes(search) &&
        !(s.chefDeService ?? "").toLowerCase().includes(search)
      ) return false;
      if (filterFormation && s.formation.id !== filterFormation) return false;
      return true;
    });
  }, [services, q, filterFormation]);

  const resetFilters = () => { setQ(""); setFilterFormation(""); };
  const hasFilters = q || filterFormation;

  const exportCsv = () => {
    const esc = (v: any) => { const s = String(v ?? ""); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const lines = [
      "codeService;libelleService;codeFormation;libelleFormation;chefDeService",
      ...filtered.map((s) => [
        esc(s.code), esc(s.libelle),
        esc(s.formation.code),
        esc(s.formation.libelle),
        esc(s.chefDeService ?? ""),
      ].join(";")),
    ];
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `services_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({ code: s.code, libelle: s.libelle, formationId: s.formation.id, chefDeService: s.chefDeService ?? "" });
    setFormError("");
    setOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!form.code || !form.libelle || !form.formationId) { setFormError("Code, libellé et formation sont obligatoires"); return; }
    setSaving(true);
    try {
      const body = { ...form, chefDeService: form.chefDeService || null };
      const res = editing
        ? await fetch(`/api/services/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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

  const handleDelete = async (s: Service) => {
    if (!confirm(`Supprimer le service "${s.libelle}" ?`)) return;
    const res = await fetch(`/api/services/${s.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    await load();
  };

  return (
    <Box p={4}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Référentiel — Services</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportCsv} disabled={filtered.length === 0}>
            Exporter
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Nouveau service</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Barre de recherche */}
      <Paper sx={{ p: 2, mb: 2 }} elevation={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <TextField
            label="Rechercher code, libellé ou chef de service"
            size="small"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 260 }}
            slotProps={{ input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} /> } }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Formation</InputLabel>
            <Select label="Formation" value={filterFormation} onChange={(e) => setFilterFormation(e.target.value)}>
              <MenuItem value="">Toutes les formations</MenuItem>
              {formations.map((f) => <MenuItem key={f.id} value={f.id}>{f.libelle}</MenuItem>)}
            </Select>
          </FormControl>
          {hasFilters && (
            <Button size="small" startIcon={<ClearIcon />} onClick={resetFilters} color="secondary">
              Réinitialiser
            </Button>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
            {filtered.length} / {services.length}
          </Typography>
        </Stack>
      </Paper>

      <Paper>
        {loading ? (
          <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
        ) : filtered.length === 0 ? (
          <Typography p={3} color="text.secondary" align="center">
            {hasFilters ? "Aucun service ne correspond aux filtres." : "Aucun service enregistré."}
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "background.default" }}>
                <TableCell>Code</TableCell>
                <TableCell>Libellé</TableCell>
                <TableCell>Formation</TableCell>
                <TableCell>Chef de service</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell><Chip label={s.code} size="small" variant="outlined" sx={{ fontFamily: "monospace" }} /></TableCell>
                  <TableCell><Typography fontWeight={500}>{s.libelle}</Typography></TableCell>
                  <TableCell><Chip label={s.formation.libelle} size="small" color="secondary" variant="outlined" /></TableCell>
                  <TableCell>{s.chefDeService ?? <Typography variant="body2" color="text.disabled">—</Typography>}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="Modifier"><IconButton size="small" onClick={() => openEdit(s)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => handleDelete(s)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Modifier le service" : "Nouveau service"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField label="Code" size="small" fullWidth value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
            <TextField label="Libellé" size="small" fullWidth value={form.libelle} onChange={(e) => setForm((f) => ({ ...f, libelle: e.target.value }))} />
            <FormControl size="small" fullWidth>
              <InputLabel>Formation</InputLabel>
              <Select label="Formation" value={form.formationId} onChange={(e) => setForm((f) => ({ ...f, formationId: e.target.value }))}>
                <MenuItem value=""><em>Sélectionner</em></MenuItem>
                {formations.map((f) => <MenuItem key={f.id} value={f.id}>{f.libelle}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              label="Chef de service (libellé)"
              size="small" fullWidth
              value={form.chefDeService}
              onChange={(e) => setForm((f) => ({ ...f, chefDeService: e.target.value }))}
              placeholder="Ex : Dr. Martin"
            />
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
