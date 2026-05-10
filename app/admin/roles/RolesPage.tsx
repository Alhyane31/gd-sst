"use client";

import {
  Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel,
  IconButton, Paper, Stack, Switch, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useCallback, useEffect, useState } from "react";
import { ALL_MENU_KEYS, MENU_LABELS } from "@/lib/menu-keys";

type AppRole = {
  id: string; name: string; description: string | null;
  menuAccess: string[]; canValidateForms: boolean;
  _count: { users: number };
};

const EMPTY_FORM = { name: "", description: "", menuAccess: [] as string[], canValidateForms: false };

const MENU_GROUPS = [
  { label: "Navigation principale", keys: ["HOME", "PERSONNEL", "CONVOCATIONS", "BORDEREAUX", "VISITES", "CALENDRIER", "JOURS_FERIES"] },
  { label: "Référentiels", keys: ["REF_CIM11", "REF_POSTES", "REF_FORMATIONS", "REF_SERVICES"] },
  { label: "Administration", keys: ["ADMIN_USERS", "ADMIN_ROLES"] },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AppRole | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetch("/api/admin/roles").then((r) => r.json());
      setRoles(Array.isArray(data) ? data : []);
    } catch {
      setError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setOpen(true);
  };

  const openEdit = (r: AppRole) => {
    setEditing(r);
    setForm({ name: r.name, description: r.description ?? "", menuAccess: [...r.menuAccess], canValidateForms: r.canValidateForms });
    setFormError("");
    setOpen(true);
  };

  const toggleMenu = (key: string) => {
    setForm((f) => ({
      ...f,
      menuAccess: f.menuAccess.includes(key) ? f.menuAccess.filter((k) => k !== key) : [...f.menuAccess, key],
    }));
  };

  const toggleAll = () => {
    setForm((f) => ({ ...f, menuAccess: f.menuAccess.length === ALL_MENU_KEYS.length ? [] : [...ALL_MENU_KEYS] }));
  };

  const handleSave = async () => {
    setFormError("");
    if (!form.name) { setFormError("Le nom est obligatoire"); return; }
    setSaving(true);
    try {
      const res = editing
        ? await fetch(`/api/admin/roles/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
        : await fetch("/api/admin/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
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

  const handleDelete = async (r: AppRole) => {
    if (r._count.users > 0) { alert(`Ce rôle est assigné à ${r._count.users} utilisateur(s). Veuillez les réaffecter avant de supprimer.`); return; }
    if (!confirm(`Supprimer le rôle "${r.name}" ?`)) return;
    const res = await fetch(`/api/admin/roles/${r.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    await load();
  };

  return (
    <Box p={4}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Gestion des rôles</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nouveau rôle
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper>
        {loading ? (
          <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "background.default" }}>
                <TableCell>Nom du rôle</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Menus accessibles</TableCell>
                <TableCell>Validation formulaires</TableCell>
                <TableCell>Utilisateurs</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell><Typography fontWeight={600}>{r.name}</Typography></TableCell>
                  <TableCell>{r.description ?? <Typography variant="body2" color="text.disabled">—</Typography>}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, maxWidth: 400 }}>
                      {r.menuAccess.length === 0
                        ? <Typography variant="body2" color="text.disabled">Aucun</Typography>
                        : r.menuAccess.map((k) => <Chip key={k} label={MENU_LABELS[k] ?? k} size="small" variant="outlined" />)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={r.canValidateForms ? "Oui" : "Non"} size="small" color={r.canValidateForms ? "success" : "default"} />
                  </TableCell>
                  <TableCell>
                    <Chip label={r._count.users} size="small" color={r._count.users > 0 ? "info" : "default"} />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="Modifier">
                        <IconButton size="small" onClick={() => openEdit(r)}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton size="small" color="error" onClick={() => handleDelete(r)}><DeleteIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Dialog create/edit */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Modifier le rôle" : "Nouveau rôle"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField label="Nom du rôle" size="small" fullWidth value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <TextField label="Description" size="small" fullWidth multiline rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />

            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2" fontWeight={600}>Accès aux menus</Typography>
                <Button size="small" onClick={toggleAll}>
                  {form.menuAccess.length === ALL_MENU_KEYS.length ? "Tout décocher" : "Tout cocher"}
                </Button>
              </Stack>
              {MENU_GROUPS.map((group) => (
                <Box key={group.label} mb={1.5}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {group.label}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                    {group.keys.map((key) => (
                      <FormControlLabel
                        key={key}
                        control={<Checkbox size="small" checked={form.menuAccess.includes(key)} onChange={() => toggleMenu(key)} />}
                        label={<Typography variant="body2">{MENU_LABELS[key]}</Typography>}
                        sx={{ width: "50%" }}
                      />
                    ))}
                  </Box>
                  <Divider sx={{ mt: 1 }} />
                </Box>
              ))}
            </Box>

            <FormControlLabel
              control={<Switch checked={form.canValidateForms} onChange={(e) => setForm((f) => ({ ...f, canValidateForms: e.target.checked }))} />}
              label="Peut valider les formulaires"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
