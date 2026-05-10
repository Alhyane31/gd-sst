"use client";

import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControl, InputAdornment, InputLabel, MenuItem,
  Select, Stack, TextField, Tooltip, Typography,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { useEffect, useState } from "react";

type Poste     = { id: string; libelle: string; details?: { id: string; libelle: string }[] };
type Formation = { id: string; libelle: string };
type Service   = { id: string; libelle: string };

const STATUTS = [
  { value: "CELIBATAIRE", label: "Célibataire" },
  { value: "MARIE",       label: "Marié(e)" },
  { value: "DIVORCE",     label: "Divorcé(e)" },
  { value: "VEUF",        label: "Veuf / Veuve" },
];

const EMPTY = {
  firstName: "", lastName: "", matricule: "", email: "",
  dateNaissance: "", statutSocial: "",
  posteId: "", posteDetailId: "", formationId: "", serviceId: "",
  categorie: "VP", dateAffectation: "",
};

type Props = { open: boolean; onClose: () => void; onSuccess: () => void };

/** Génère une suggestion côté client pour l'aperçu (pas de vérification unicité) */
function suggestMatricule(lastName: string, firstName: string): string {
  const init = (s: string) => (s.trim().match(/[A-Za-zÀ-ÿ]/)?.[0] ?? "X").toUpperCase();
  const digits = String(Math.floor(100000 + Math.random() * 900000));
  return init(lastName) + init(firstName) + digits;
}

export default function PersonnelCreateDialog({ open, onClose, onSuccess }: Props) {
  const [form,       setForm]       = useState(EMPTY);
  const [postes,     setPostes]     = useState<Poste[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [services,   setServices]   = useState<Service[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setError("");
    Promise.all([
      fetch("/api/postes?isActive=true").then((r) => r.json()),
      fetch("/api/formations").then((r) => r.json()),
    ]).then(([p, f]) => {
      setPostes(Array.isArray(p) ? p : []);
      setFormations(Array.isArray(f) ? f : []);
    });
  }, [open]);

  useEffect(() => {
    setServices([]);
    setForm((f) => ({ ...f, serviceId: "" }));
    if (!form.formationId) return;
    fetch(`/api/formations/${form.formationId}/services`)
      .then((r) => r.json())
      .then((d) => setServices(Array.isArray(d) ? d : []));
  }, [form.formationId]);

  const selectedPoste = postes.find((p) => p.id === form.posteId);

  const set = (k: keyof typeof EMPTY) => (e: any) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleGenerateMatricule = () => {
    if (!form.lastName && !form.firstName) return;
    setForm((f) => ({ ...f, matricule: suggestMatricule(f.lastName || "X", f.firstName || "X") }));
  };

  const handleSave = async () => {
    setError("");
    if (!form.firstName || !form.lastName)               { setError("Prénom et nom sont obligatoires"); return; }
    if (!form.posteId || !form.formationId || !form.serviceId) { setError("Poste, formation et service sont obligatoires"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/personnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          matricule:      form.matricule || null,
          email:          form.email || null,
          dateNaissance:  form.dateNaissance || null,
          statutSocial:   form.statutSocial || null,
          posteDetailId:  form.posteDetailId || null,
          dateAffectation: form.dateAffectation || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      onSuccess();
      onClose();
    } catch {
      setError("Erreur serveur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Nouveau personnel</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} mt={1}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* ── Informations générales ── */}
          <Typography variant="subtitle2" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
            Informations générales
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="Nom *" size="small" fullWidth value={form.lastName}
              onChange={set("lastName")} />
            <TextField label="Prénom *" size="small" fullWidth value={form.firstName}
              onChange={set("firstName")} />
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Date de naissance" type="date" size="small" fullWidth
              value={form.dateNaissance} onChange={set("dateNaissance")}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Statut social</InputLabel>
              <Select label="Statut social" value={form.statutSocial} onChange={set("statutSocial")}>
                <MenuItem value=""><em>Sélectionner</em></MenuItem>
                {STATUTS.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Tooltip title={!form.lastName && !form.firstName ? "Renseignez le nom et prénom d'abord" : "Générer un matricule automatique"} placement="top">
              <span style={{ flex: 1 }}>
                <TextField
                  label="Matricule interne"
                  size="small"
                  fullWidth
                  value={form.matricule}
                  onChange={set("matricule")}
                  placeholder="Laisser vide pour génération auto"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Générer un matricule">
                            <span>
                              <Button
                                size="small"
                                onClick={handleGenerateMatricule}
                                disabled={!form.lastName && !form.firstName}
                                sx={{ minWidth: 0, p: 0.5 }}
                              >
                                <AutoFixHighIcon fontSize="small" />
                              </Button>
                            </span>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </span>
            </Tooltip>
            <TextField label="Email" type="email" size="small" fullWidth value={form.email} onChange={set("email")} />
          </Stack>

          {!form.matricule && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
              Si laissé vide, un matricule sera généré automatiquement (ex : {suggestMatricule(form.lastName || "N", form.firstName || "P")})
            </Typography>
          )}

          <Divider />

          {/* ── Informations professionnelles ── */}
          <Typography variant="subtitle2" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
            Informations professionnelles
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Formation *</InputLabel>
              <Select label="Formation *" value={form.formationId}
                onChange={(e) => setForm((f) => ({ ...f, formationId: e.target.value, serviceId: "" }))}>
                <MenuItem value=""><em>Sélectionner</em></MenuItem>
                {formations.map((f) => <MenuItem key={f.id} value={f.id}>{f.libelle}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth disabled={!form.formationId}>
              <InputLabel>Service *</InputLabel>
              <Select label="Service *" value={form.serviceId} onChange={set("serviceId")}>
                <MenuItem value=""><em>Sélectionner</em></MenuItem>
                {services.map((s) => <MenuItem key={s.id} value={s.id}>{s.libelle}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Poste *</InputLabel>
              <Select label="Poste *" value={form.posteId}
                onChange={(e) => setForm((f) => ({ ...f, posteId: e.target.value, posteDetailId: "" }))}>
                <MenuItem value=""><em>Sélectionner</em></MenuItem>
                {postes.map((p) => <MenuItem key={p.id} value={p.id}>{p.libelle}</MenuItem>)}
              </Select>
            </FormControl>

            {selectedPoste?.details && selectedPoste.details.length > 0 ? (
              <FormControl size="small" fullWidth>
                <InputLabel>Détail du poste</InputLabel>
                <Select label="Détail du poste" value={form.posteDetailId} onChange={set("posteDetailId")}>
                  <MenuItem value=""><em>Aucun</em></MenuItem>
                  {selectedPoste.details.map((d) => <MenuItem key={d.id} value={d.id}>{d.libelle}</MenuItem>)}
                </Select>
              </FormControl>
            ) : <Box flex={1} />}
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Catégorie</InputLabel>
              <Select label="Catégorie" value={form.categorie} onChange={set("categorie")}>
                <MenuItem value="VP">VP</MenuItem>
                <MenuItem value="SMR">SMR</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Date d'affectation CHU" type="date" size="small" fullWidth
              value={form.dateAffectation} onChange={set("dateAffectation")}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Enregistrement..." : "Créer"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
