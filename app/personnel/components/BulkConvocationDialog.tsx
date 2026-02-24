// app/personnel/components/BulkConvocationDialog.tsx
"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem,
  Typography,
  LinearProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import type { Filters } from "./buildPersonnelQuery";
import { buildPersonnelQuery } from "./buildPersonnelQuery";

type Props = {
  open: boolean;
  onClose: () => void;
  appliedFilters: Filters;
  total: number; // total résultat recherche
  personnelIds?: string[]; 
  onSuccess?: () => void;
};

type ConvocationType = "INITIALE" | "RELANCE_1" | "RELANCE_2" | "RELANCE_3";
type ConvocationStatut =
  | "A_CONVOQUER"
  | "CONVOCATION_GENEREE"
  | "A_TRAITER"
  | "A_RELANCER"
  | "RELANCEE"
  | "REALISEE"
  | "ANNULEE";

type ApiResponse = {
  items: Array<{ id: string }>;
  total: number;
  page: number;
  pageSize: number;
};

type PlanRow = {
  id: string;
  day: string;      // YYYY-MM-DD
  qty: number;      // à créer
  existing: number; // non annulé déjà existant (tous services)
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function toDatetimeLocalValue(d: Date) {
  return dayjs(d).format("YYYY-MM-DDTHH:mm");
}

async function fetchAllPersonnelIds(filters: Filters) {
  const pageSize = 500;
  let page = 0;

  const ids: string[] = [];
  let total = Infinity;

  while (ids.length < total) {
    const qs = buildPersonnelQuery(filters, page, pageSize);
    const res = await fetch(`/api/personnel?${qs}`);
    if (!res.ok) throw new Error(`Erreur /api/personnel (${res.status})`);

    const data: ApiResponse = await res.json();
    total = data.total ?? 0;

    const chunk = Array.isArray(data.items) ? data.items : [];
    ids.push(...chunk.map((x) => x.id));

    if (chunk.length === 0) break;
    page += 1;
  }

  return Array.from(new Set(ids));
}

/**
 * Répartit N rendez-vous sur les créneaux 09:00..14:00.
 * - base: 6 heures (9,10,11,12,13,14)
 * - si N > 6 : on remplit par minutes (09:00,09:10,09:20... puis 10:00...)
 */
function buildSlotsForDay(day: string, n: number): string[] {
  const hours = [9, 10, 11, 12, 13, 14];
  if (n <= 0) return [];

  const perHour = Math.ceil(n / hours.length);
  const step = perHour <= 1 ? 60 : Math.max(1, Math.floor(60 / perHour));

  const slots: string[] = [];
  let remaining = n;

  for (const h of hours) {
    if (remaining <= 0) break;

    const take = Math.min(perHour, remaining);
    for (let i = 0; i < take; i++) {
      const minute = i * step;
      const dt = dayjs(`${day}T00:00`).hour(h).minute(minute).second(0).millisecond(0);
      slots.push(dt.toISOString());
    }
    remaining -= take;
  }

  // cas extrême : on continue sur 14h en ajoutant des minutes
  let k = 0;
  while (remaining > 0) {
    const dt = dayjs(`${day}T00:00`).hour(14).minute(Math.min(59, k)).second(0).millisecond(0);
    slots.push(dt.toISOString());
    remaining--;
    k++;
  }

  return slots;
}


export default function BulkConvocationDialog({
  open,
  onClose,
  appliedFilters,
  total,
  personnelIds,        // ✅ récupéré depuis props
  onSuccess,
}: Props) {
  const defaultDateConvoc = useMemo(() => toDatetimeLocalValue(new Date()), []);

  const [saving, setSaving] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>("");

  const [form, setForm] = useState({
    statut: "A_CONVOQUER" as ConvocationStatut,
    convocationType: "INITIALE" as ConvocationType,
    dateConvocation: defaultDateConvoc, // défaut: maintenant
    commentaire: "",
  });

  const [plan, setPlan] = useState<PlanRow[]>([]);

  const totalPlanned = useMemo(
    () => plan.reduce((s, r) => s + (Number(r.qty) || 0), 0),
    [plan]
  );

  // init quand on ouvre
  useEffect(() => {
    if (!open) return;

    setSaving(false);
    setProgressMsg("");
    setForm((p) => ({ ...p, dateConvocation: defaultDateConvoc, commentaire: "" }));

    // 1 ligne par défaut : J+14 avec qty = total
    const day = dayjs().add(14, "day").format("YYYY-MM-DD");
    setPlan([{ id: uid(), day, qty: total || 0, existing: 0 }]);
  }, [open, total, defaultDateConvoc]);

  // ✅ clé stable des jours pour déclencher le refresh count uniquement quand les dates changent
  const dayKey = useMemo(() => plan.map((p) => p.day).join("|"), [plan]);

  // ✅ count existant global (tous services) pour chaque date
  useEffect(() => {
    if (!open) return;
    if (plan.length === 0) return;

    let cancelled = false;

    const run = async () => {
      const updates = await Promise.all(
        plan.map(async (r) => {
          try {
            if (!r.day) return { id: r.id, existing: 0 };

            const url = `/api/convocations/count?day=${encodeURIComponent(r.day)}`;
            console.log("🌐 COUNT URL =", url);

            const res = await fetch(url);
            console.log("📡 COUNT status =", res.status);

            if (!res.ok) return { id: r.id, existing: 0 };

            const data = await res.json().catch(() => ({}));
            console.log("📦 COUNT data =", data);

            // accepte totalNonAnnule (recommandé) ou count (si tu gardes l’ancien nom)
            const n =
              Number(data?.totalNonAnnule ?? data?.count ?? 0);

            return { id: r.id, existing: Number.isFinite(n) ? n : 0 };
          } catch (e) {
            console.error("❌ COUNT error", e);
            return { id: r.id, existing: 0 };
          }
        })
      );

      if (cancelled) return;

      setPlan((prev) =>
        prev.map((r) => {
          const u = updates.find((x) => x.id === r.id);
          return u ? { ...r, existing: u.existing } : r;
        })
      );
    };

    run();

    return () => {
      cancelled = true;
    };
    // important: dayKey seulement (pas tout "plan" sinon boucle)
  }, [open, dayKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const addRow = () => {
    setPlan((prev) => [
      ...prev,
      { id: uid(), day: dayjs().add(14, "day").format("YYYY-MM-DD"), qty: 0, existing: 0 },
    ]);
  };

  const removeRow = (id: string) => setPlan((prev) => prev.filter((r) => r.id !== id));

  const updateRow = (id: string, patch: Partial<PlanRow>) =>
    setPlan((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const canCreate = useMemo(() => {
    if (total === 0) return false;
      if (totalPlanned !== total) return false;
    if (totalPlanned <= 0) return false;
    if (totalPlanned > total) return false;

    // dates valides
    if (plan.some((r) => !r.day || Number.isNaN(new Date(`${r.day}T00:00:00`).getTime()))) return false;

    return true;
  }, [total, totalPlanned, plan]);

  const handleCreate = async () => {
    if (!canCreate) return;

    setSaving(true);
    setProgressMsg("Récupération des IDs du personnel…");

    try {

      const ids =
       Array.isArray(personnelIds) && personnelIds.length > 0
    ? personnelIds
    : await fetchAllPersonnelIds(appliedFilters);


      console.log("🧾 Bulk plan =", plan);
      console.log("🧾 Bulk total IDs récupérés =", ids.length);

      if (ids.length === 0) {
        alert("Aucun personnel trouvé pour ces filtres.");
        return;
      }

      // on ne crée que totalPlanned
      const targetIds = ids.slice(0, totalPlanned);

      // construire les slots ISO
      const allSlots: string[] = [];
      for (const r of plan) {
        allSlots.push(...buildSlotsForDay(r.day, Number(r.qty) || 0));
      }

      if (allSlots.length !== targetIds.length) {
        alert("Plan invalide : le total des créneaux ne correspond pas au total à créer.");
        return;
      }

      setProgressMsg("Création des convocations…");

      /**
       * ⚠️ IMPORTANT : ton endpoint bulk actuel prend personnelIds + datePrevue unique.
       * Ici on envoie des ROWS (personnelId, datePrevue) => il faut que ton /api/convocations/bulk accepte "rows".
       * Si tu veux je te donne le patch exact côté API bulk pour accepter rows.
       */
      const payload = {
        rows: targetIds.map((personnelId, i) => ({
          personnelId,
          datePrevue: allSlots[i],
        })),
        statut: form.statut,
        convocationType: form.convocationType,
        dateConvocation: form.dateConvocation
          ? new Date(form.dateConvocation).toISOString()
          : new Date().toISOString(),
        commentaire: form.commentaire || null,
      };

      const res = await fetch("/api/convocations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      console.log("📡 /api/convocations/bulk status:", res.status);
      console.log("📦 /api/convocations/bulk data:", data);

      if (!res.ok) {
        alert(data?.error ?? "Erreur bulk");
        return;
      }

      onClose();
      onSuccess?.();
    } catch (e: any) {
      console.error("Bulk error", e);
      alert(e?.message ?? "Erreur bulk");
    } finally {
      setSaving(false);
      setProgressMsg("");
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Générer convocations (répartition multi-jours)</DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Résultat de recherche : <b>{total}</b>
        </Typography>

        <Typography variant="body2" color={totalPlanned > total ? "error" : "text.secondary"} sx={{ mb: 2 }}>
          Total à créer (planifié) : <b>{totalPlanned}</b>{" "}
          {totalPlanned > total ? "— dépasse le total du résultat !" : ""}
        </Typography>

        {saving && (
          <>
            <LinearProgress sx={{ mb: 1 }} />
            <Typography variant="caption" color="text.secondary">
              {progressMsg}
            </Typography>
          </>
        )}

        <Stack spacing={2} sx={{ mt: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Statut"
              size="small"
              value={form.statut}
              onChange={(e) => setForm((p) => ({ ...p, statut: e.target.value as any }))}
              sx={{ flex: 1 }}
            >
              <MenuItem value="A_CONVOQUER">À convoquer</MenuItem>
              <MenuItem value="CONVOCATION_GENEREE">Convocation générée</MenuItem>
              <MenuItem value="A_TRAITER">À traiter</MenuItem>
              <MenuItem value="A_RELANCER">À relancer</MenuItem>
              <MenuItem value="RELANCEE">Relancé</MenuItem>
              <MenuItem value="REALISEE">Réalisée</MenuItem>
              <MenuItem value="ANNULEE">Annulée</MenuItem>
            </TextField>

            <TextField
              select
              label="Type convocation"
              size="small"
              value={form.convocationType}
              onChange={(e) => setForm((p) => ({ ...p, convocationType: e.target.value as any }))}
              sx={{ flex: 1 }}
            >
              <MenuItem value="INITIALE">Initiale</MenuItem>
              <MenuItem value="RELANCE_1">Relance 1</MenuItem>
              <MenuItem value="RELANCE_2">Relance 2</MenuItem>
              <MenuItem value="RELANCE_3">Relance 3</MenuItem>
            </TextField>

            <TextField
              type="datetime-local"
              label="Date convocation (unique)"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={form.dateConvocation}
              onChange={(e) => setForm((p) => ({ ...p, dateConvocation: e.target.value }))}
              sx={{ flex: 1 }}
            />
          </Stack>

          <TextField
            label="Commentaire"
            size="small"
            multiline
            minRows={2}
            value={form.commentaire}
            onChange={(e) => setForm((p) => ({ ...p, commentaire: e.target.value }))}
          />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2">Planification par date</Typography>
            <Button startIcon={<AddIcon />} onClick={addRow} disabled={saving}>
              Ajouter une date
            </Button>
          </Stack>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={200}>Date</TableCell>
                <TableCell width={190}>Déjà existant (non annulé)</TableCell>
                <TableCell width={160}>À créer ce jour</TableCell>
                <TableCell>Heures générées</TableCell>
                <TableCell width={60} align="center"></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {plan.map((r) => {
                const qty = Number(r.qty) || 0;
                const slotsPreview = buildSlotsForDay(r.day, Math.min(qty, 10))
                  .map((iso) => dayjs(iso).format("HH:mm"))
                  .join(", ");
                const more = qty > 10 ? "…" : "";

                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <TextField
                        type="date"
                        size="small"
                        value={r.day}
                        onChange={(e) => updateRow(r.id, { day: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        <b>{r.existing}</b>
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={r.qty}
                        onChange={(e) =>
                          updateRow(r.id, { qty: Math.max(0, parseInt(e.target.value || "0", 10)) })
                        }
                        inputProps={{ min: 0 }}
                        fullWidth
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {qty > 0 ? `${slotsPreview}${more} (09:00 → 14:00)` : "-"}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <IconButton onClick={() => removeRow(r.id)} disabled={saving || plan.length === 1}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Typography variant="caption" color="text.secondary">
            Répartition automatique : 09:00, 10:00, 11:00, 12:00, 13:00, 14:00. Si le volume dépasse 6, les minutes sont réparties (09:00, 09:10, 09:20… puis 10:00…).
          </Typography>

          <Typography variant="caption" color={totalPlanned > total ? "error" : "text.secondary"}>
            Astuce : le “déjà existant” est global (tous services) sur la journée, hors ANNULEE.
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Fermer
        </Button>
        <Button variant="contained" onClick={handleCreate} disabled={saving || !canCreate}>
          {saving ? "Génération..." : `Générer (${totalPlanned})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
