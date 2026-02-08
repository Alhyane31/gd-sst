// app/bordereaux/components/CreateBordereauDialog.tsx
"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

type FormationMini = { id: string; libelle: string };
type ServiceMini = { id: string; libelle: string };

export default function CreateBordereauDialog({
  open,
  onClose,
  formations,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  formations: FormationMini[];
  onCreated: () => void;
}) {
  const [formationId, setFormationId] = useState("");
  const [services, setServices] = useState<ServiceMini[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const [serviceId, setServiceId] = useState("");
  const [dateEdition, setDateEdition] = useState(""); // YYYY-MM-DD
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFormationId("");
    setServices([]);
    setServiceId("");
    setDateEdition("");
    setSaving(false);
    setLoadingServices(false);
  }, [open]);

  // services selon formation
  useEffect(() => {
    const run = async () => {
      if (!open) return;

      if (!formationId) {
        setServices([]);
        setServiceId("");
        return;
      }

      setLoadingServices(true);
      try {
        const res = await fetch(`/api/formations/${formationId}/services`);
        const data = await res.json().catch(() => []);
        const items: ServiceMini[] = Array.isArray(data) ? data : data.items ?? [];
        setServices(items);
      } catch {
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };

    run();
  }, [open, formationId]);

  const canSave = useMemo(() => serviceId.length > 0 && !saving, [serviceId, saving]);

  const handleCreate = async () => {
    if (!serviceId) return;

    setSaving(true);
    try {
      const payload: any = { serviceId };

      // optionnel: si tu veux fixer l’heure à 09:00
      if (dateEdition) payload.dateEdition = new Date(`${dateEdition}T09:00:00.000Z`).toISOString();

      const res = await fetch("/api/bordereaux", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Erreur création");
        return;
      }

      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Créer un bordereau</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            size="small"
            label="Formation"
            value={formationId}
            onChange={(e) => {
              setFormationId(e.target.value);
              setServiceId(""); // reset service
            }}
            fullWidth
          >
            <MenuItem value="">Choisir...</MenuItem>
            {formations.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                {f.libelle}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Service"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            fullWidth
            disabled={!formationId || loadingServices}
            helperText={!formationId ? "Choisis une formation d’abord." : loadingServices ? "Chargement services..." : ""}
          >
            <MenuItem value="">Choisir...</MenuItem>
            {services.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.libelle}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            size="small"
            type="date"
            label="Date d’édition (optionnel)"
            InputLabelProps={{ shrink: true }}
            value={dateEdition}
            onChange={(e) => setDateEdition(e.target.value)}
            fullWidth
            helperText="Si vide : aujourd’hui."
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Fermer
        </Button>
        <Button variant="contained" onClick={handleCreate} disabled={!canSave}>
          {saving ? "Création..." : "Créer"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
