"use client";

import { Box, Button, MenuItem, Paper, Stack, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { useEffect, useState } from "react";

export type BordereauStatut = "" | "NOUVEAU" | "GENERE";

export type BordereauxFilters = {
  formationId: string;
  serviceId: string;

  statut: BordereauStatut;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string; // YYYY-MM-DD
  q: string; // serial contains
};

type FormationMini = { id: string; libelle: string };
type ServiceMini = { id: string; libelle: string };

export default function BordereauxSearchFilters({
  formations,
  value,
  onChange,
  onReset,
}: {
  formations: FormationMini[];
  value: BordereauxFilters;
  onChange: (v: BordereauxFilters) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = useState<BordereauxFilters>(value);
  const [services, setServices] = useState<ServiceMini[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  useEffect(() => setDraft(value), [value]);

  // services selon formation (draft)
  useEffect(() => {
    const run = async () => {
      if (!draft.formationId) {
        setServices([]);
        return;
      }
      setLoadingServices(true);
      try {
        const res = await fetch(`/api/formations/${draft.formationId}/services`);
        const data = await res.json().catch(() => []);
        setServices(Array.isArray(data) ? data : data.items ?? []);
      } catch {
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };
    run();
  }, [draft.formationId]);

  const field20 = {
    flexBasis: { xs: "100%", md: "20%" },
    flexGrow: 1,
    minWidth: 200,
  } as const;

  return (
    <Paper sx={{ p: 2, mb: 3 }} elevation={10}>
      <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" alignItems="center">
        {/* Formation */}
        <TextField
          select
          size="small"
          label="Formation"
          value={draft.formationId}
          onChange={(e) =>
            setDraft((p) => ({
              ...p,
              formationId: e.target.value,
              serviceId: "", // reset service quand formation change
            }))
          }
          sx={field20}
        >
          <MenuItem value="">Toutes</MenuItem>
          {formations.map((f) => (
            <MenuItem key={f.id} value={f.id}>
              {f.libelle}
            </MenuItem>
          ))}
        </TextField>

        {/* Service (dépend de formation) */}
        <TextField
          select
          size="small"
          label="Service"
          value={draft.serviceId}
          onChange={(e) => setDraft((p) => ({ ...p, serviceId: e.target.value }))}
          sx={field20}
          disabled={!draft.formationId || loadingServices}
        >
          <MenuItem value="">Tous</MenuItem>
          {services.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.libelle}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Statut"
          value={draft.statut}
          onChange={(e) => setDraft((p) => ({ ...p, statut: e.target.value as any }))}
          sx={field20}
        >
          <MenuItem value="">Tous</MenuItem>
          <MenuItem value="NOUVEAU">Nouveau</MenuItem>
          <MenuItem value="GENERE">Généré</MenuItem>
        </TextField>

        <TextField
          size="small"
          type="date"
          label="Date début"
          InputLabelProps={{ shrink: true }}
          value={draft.dateFrom}
          onChange={(e) => setDraft((p) => ({ ...p, dateFrom: e.target.value }))}
          sx={field20}
        />

        <TextField
          size="small"
          type="date"
          label="Date fin"
          InputLabelProps={{ shrink: true }}
          value={draft.dateTo}
          onChange={(e) => setDraft((p) => ({ ...p, dateTo: e.target.value }))}
          sx={field20}
        />

        <TextField
          size="small"
          label="Recherche (serial)"
          placeholder="Ex: BDR-2026-02"
          value={draft.q}
          onChange={(e) => setDraft((p) => ({ ...p, q: e.target.value }))}
          sx={field20}
        />

        <Box
          sx={{
            flexBasis: { xs: "100%", md: "20%" },
            flexGrow: 1,
            minWidth: 200,
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
          }}
        >
          <Button variant="contained" startIcon={<SearchIcon />} onClick={() => onChange(draft)}>
            Rechercher
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ClearIcon />}
            onClick={() => onReset()}
          >
            Vider
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
