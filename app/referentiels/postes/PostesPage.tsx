"use client";

import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, FormControlLabel, IconButton,
  InputLabel, MenuItem, Paper, Select, Stack, Switch, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import DownloadIcon from "@mui/icons-material/Download";
import { useCallback, useEffect, useMemo, useState } from "react";

type Poste = { id: string; code: string; libelle: string; categorieForm: string | null; isActive: boolean };

const EMPTY_FORM = { code: "", libelle: "", categorieForm: "", isActive: true };

const CATEGORIE_OPTIONS = [
  { value: "", label: "—" },
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
];

export default function PostesPage() {
  const [postes, setPostes] = useState<Poste[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Poste | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // ── filtres ──
  const [q, setQ] = useState("");
  const [filterCategorie, setFilterCategorie] = useState("");
  const [filterStatut, setFilterStatut] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetch("/api/postes").then((r) => r.json());
      setPostes(Array.isArray(data) ? data : []);
    } catch {
      setError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const search = q.toLowerCase();
    return postes.filter((p) => {
      if (search && !p.code.toLowerCase().includes(search) && !p.libelle.toLowerCase().includes(search)) return false;
      if (filterCategorie && p.categorieForm !== filterCategorie) return false;
      if (filterStatut === "actif" && !p.isActive) return false;
      if (filterStatut === "inactif" && p.isActive) return false;
      return true;
    });
  }, [postes, q, filterCategorie, filterStatut]);

  const resetFilters = () => { setQ(""); setFilterCategorie(""); setFilterStatut(""); };
  const hasFilters = q || filterCategorie || filterStatut;

  const exportCsv = () => {
    const esc = (v: any) => { const s = String(v ?? ""); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const lines = [
      "code;libelle;categorieForm;statut",
      ...filtered.map((p) => [esc(p.code), esc(p.libelle), esc(p.categorieForm ?? ""), esc(p.isActive ? "Actif" : "Inactif")].join(";")),
    ];
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `postes_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setOpen(true);
  };

  const openEdit = (p: Poste) => {
    setEditing(p);
    setForm({ code: p.code, libelle: p.libelle, categorieForm: p.categorieForm ?? "", isActive: p.isActive });
    setFormError("");
    setOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!form.code || !form.libelle) { setFormError("Code et libellé sont obligatoires"); return; }
    setSaving(true);
    try {
      const body = { ...form, categorieForm: form.categorieForm || null };
      const res = editing
        ? await fetch(`/api/postes/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/postes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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

  const handleDelete = async (p: Poste) => {
    if (!confirm(`Supprimer le poste "${p.libelle}" ?`)) return;
    const res = await fetch(`/api/postes/${p.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    await load();
  };

  return (
    <Box p={4}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Référentiel — Postes</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportCsv} disabled={filtered.length === 0}>
            Exporter
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Nouveau poste</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Barre de recherche */}
      <Paper sx={{ p: 2, mb: 2 }} elevation={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <TextField
            label="Rechercher code ou libellé"
            size="small"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 220 }}
            slotProps={{ input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} /> } }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Catégorie</InputLabel>
            <Select label="Catégorie" value={filterCategorie} onChange={(e) => setFilterCategorie(e.target.value)}>
              <MenuItem value="">Toutes</MenuItem>
              <MenuItem value="A">A</MenuItem>
              <MenuItem value="B">B</MenuItem>
              <MenuItem value="C">C</MenuItem>
              <MenuItem value="D">D</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Statut</InputLabel>
            <Select label="Statut" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="actif">Actif</MenuItem>
              <MenuItem value="inactif">Inactif</MenuItem>
            </Select>
          </FormControl>
          {hasFilters && (
            <Button size="small" startIcon={<ClearIcon />} onClick={resetFilters} color="secondary">
              Réinitialiser
            </Button>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
            {filtered.length} / {postes.length}
          </Typography>
        </Stack>
      </Paper>

      <Paper>
        {loading ? (
          <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
        ) : filtered.length === 0 ? (
          <Typography p={3} color="text.secondary" align="center">
            {hasFilters ? "Aucun poste ne correspond aux filtres." : "Aucun poste enregistré."}
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "background.default" }}>
                <TableCell>Code</TableCell>
                <TableCell>Libellé</TableCell>
                <TableCell>Catégorie</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell><Chip label={p.code} size="small" variant="outlined" sx={{ fontFamily: "monospace" }} /></TableCell>
                  <TableCell>{p.libelle}</TableCell>
                  <TableCell>
                    {p.categorieForm
                      ? <Chip label={`Cat. ${p.categorieForm}`} size="small" color="info" />
                      : <Typography variant="body2" color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell>
                    <Chip label={p.isActive ? "Actif" : "Inactif"} size="small" color={p.isActive ? "success" : "default"} />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="Modifier"><IconButton size="small" onClick={() => openEdit(p)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => handleDelete(p)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Modifier le poste" : "Nouveau poste"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField label="Code" size="small" fullWidth value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
            <TextField label="Libellé" size="small" fullWidth value={form.libelle} onChange={(e) => setForm((f) => ({ ...f, libelle: e.target.value }))} />
            <FormControl size="small" fullWidth>
              <InputLabel>Catégorie formulaire</InputLabel>
              <Select label="Catégorie formulaire" value={form.categorieForm} onChange={(e) => setForm((f) => ({ ...f, categorieForm: e.target.value }))}>
                {CATEGORIE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Switch checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />}
              label="Poste actif"
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
