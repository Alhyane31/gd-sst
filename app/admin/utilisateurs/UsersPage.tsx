"use client";

import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, FormControlLabel, IconButton,
  InputLabel, MenuItem, Paper, Select, Stack, Switch, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useCallback, useEffect, useState } from "react";

type AppRole = { id: string; name: string };
type User = {
  id: string; email: string; firstName: string; lastName: string;
  role: string; isActive: boolean; createdAt: string;
  appRole: AppRole | null;
};

const EMPTY_FORM = { email: "", password: "", firstName: "", lastName: "", role: "USER", isActive: true, appRoleId: "" };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [appRoles, setAppRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([
        fetch("/api/admin/users").then((r) => r.json()),
        fetch("/api/admin/roles").then((r) => r.json()),
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setAppRoles(Array.isArray(r) ? r : []);
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

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ email: u.email, password: "", firstName: u.firstName, lastName: u.lastName, role: u.role, isActive: u.isActive, appRoleId: u.appRole?.id ?? "" });
    setFormError("");
    setOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!form.email || !form.firstName || !form.lastName) { setFormError("Email, prénom et nom sont obligatoires"); return; }
    if (!editing && !form.password) { setFormError("Le mot de passe est obligatoire pour un nouvel utilisateur"); return; }
    setSaving(true);
    try {
      const body = { ...form, appRoleId: form.appRoleId || null, password: form.password || undefined };
      const res = editing
        ? await fetch(`/api/admin/users/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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

  const handleDeactivate = async (u: User) => {
    if (!confirm(`Désactiver le compte de ${u.firstName} ${u.lastName} ?`)) return;
    await fetch(`/api/admin/users/${u.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: false }) });
    await load();
  };

  return (
    <Box p={4}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Gestion des utilisateurs</Typography>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={openCreate}>
          Nouvel utilisateur
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
                <TableCell>Nom</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rôle système</TableCell>
                <TableCell>Rôle applicatif</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.lastName} {u.firstName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Chip label={u.role} size="small" color={u.role === "ADMIN" ? "error" : "default"} />
                  </TableCell>
                  <TableCell>
                    {u.appRole ? <Chip label={u.appRole.name} size="small" color="primary" variant="outlined" /> : <Typography variant="body2" color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell>
                    <Chip label={u.isActive ? "Actif" : "Inactif"} size="small" color={u.isActive ? "success" : "default"} />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="Modifier">
                        <IconButton size="small" onClick={() => openEdit(u)}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      {u.isActive && (
                        <Tooltip title="Désactiver">
                          <IconButton size="small" color="warning" onClick={() => handleDeactivate(u)}><PersonOffIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      )}
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
        <DialogTitle>{editing ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <Stack direction="row" spacing={2}>
              <TextField label="Prénom" size="small" fullWidth value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
              <TextField label="Nom" size="small" fullWidth value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
            </Stack>
            <TextField label="Email" type="email" size="small" fullWidth value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <TextField
              label={editing ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe"}
              type="password" size="small" fullWidth value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Rôle système</InputLabel>
              <Select label="Rôle système" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                <MenuItem value="USER">USER</MenuItem>
                <MenuItem value="ADMIN">ADMIN</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Rôle applicatif</InputLabel>
              <Select label="Rôle applicatif" value={form.appRoleId} onChange={(e) => setForm((f) => ({ ...f, appRoleId: e.target.value }))}>
                <MenuItem value=""><em>Aucun</em></MenuItem>
                {appRoles.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Switch checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />}
              label="Compte actif"
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
