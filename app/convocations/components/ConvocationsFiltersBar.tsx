"use client";

import {
  Box, Button, Checkbox, Chip, FormControl, InputLabel,
  ListItemText, MenuItem, Paper, Select, Stack, TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { Formation, Poste, Service, ConvocationsFilters, ConvocationStatut } from "../types";

const STATUT_OPTIONS: { value: ConvocationStatut; label: string }[] = [
  { value: "A_CONVOQUER",         label: "À convoquer" },
  { value: "CONVOCATION_GENEREE", label: "Convocation générée" },
  { value: "ENVOYEE",             label: "Envoyée" },
  { value: "ANNULEE",             label: "Annulée" },
];

type Props = {
  postes: Poste[];
  formations: Formation[];
  services: Service[];

  draft: ConvocationsFilters;
  onDraftChange: (patch: Partial<ConvocationsFilters>) => void;

  onSearch: () => void;
  onReset: () => void;
};

export default function ConvocationsFiltersBar({
  postes,
  formations,
  services,
  draft,
  onDraftChange,
  onSearch,
  onReset,
}: Props) {
  const field20 = {
    flexBasis: { xs: "100%", md: "20%" },
    flexGrow: 1,
    minWidth: 200,
  } as const;

  return (
    <Paper sx={{ p: 3, mb: 4 }} elevation={12}>
      <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" alignItems="flex-start">
        {/* Personnel */}
        <TextField
          size="small"
          label="Nom"
          value={draft.nom}
          sx={field20}
          onChange={(e) => onDraftChange({ nom: e.target.value })}
        />
        <TextField
          size="small"
          label="Prénom"
          value={draft.prenom}
          sx={field20}
          onChange={(e) => onDraftChange({ prenom: e.target.value })}
        />

        <TextField
          select
          size="small"
          label="Poste"
          value={draft.posteId}
          sx={field20}
          onChange={(e) => onDraftChange({ posteId: e.target.value })}
        >
          <MenuItem value="">Tous</MenuItem>
          {postes.map((p) => (
            <MenuItem key={p.id} value={p.id}>{p.libelle}</MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Formation"
          value={draft.formationId}
          sx={field20}
          onChange={(e) =>
            onDraftChange({ formationId: e.target.value, serviceIds: [] })
          }
        >
          <MenuItem value="">Toutes</MenuItem>
          {formations.map((f) => (
            <MenuItem key={f.id} value={f.id}>{f.libelle}</MenuItem>
          ))}
        </TextField>

        {/* Service — multi-select */}
        <FormControl size="small" sx={field20} disabled={!draft.formationId}>
          <InputLabel id="conv-services-label">Service</InputLabel>
          <Select
            multiple
            labelId="conv-services-label"
            label="Service"
            value={draft.serviceIds}
            onChange={(e) => onDraftChange({ serviceIds: e.target.value as string[] })}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {(selected as string[]).map((v) => (
                  <Chip
                    key={v}
                    label={services.find((s) => s.id === v)?.libelle ?? v}
                    size="small"
                  />
                ))}
              </Box>
            )}
          >
            {services.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                <Checkbox checked={draft.serviceIds.includes(s.id)} />
                <ListItemText primary={s.libelle} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          select
          size="small"
          label="Catégorie"
          value={draft.categorie}
          sx={field20}
          onChange={(e) => onDraftChange({ categorie: e.target.value as any })}
        >
          <MenuItem value="">Toutes</MenuItem>
          <MenuItem value="VP">VP</MenuItem>
          <MenuItem value="SMR">SMR</MenuItem>
        </TextField>

        {/* Convocation */}
        <TextField
          select
          size="small"
          label="Type visite"
          value={draft.visiteType}
          sx={field20}
          onChange={(e) => onDraftChange({ visiteType: e.target.value as any })}
        >
          <MenuItem value="">Tous</MenuItem>
          <MenuItem value="ANNUELLE">Annuelle</MenuItem>
          <MenuItem value="RAPPROCHEE">Rapprochée</MenuItem>
        </TextField>

        {/* Statut convocation — multi-select */}
        <FormControl size="small" sx={field20}>
          <InputLabel id="conv-statuts-label">Statut convocation</InputLabel>
          <Select
            multiple
            labelId="conv-statuts-label"
            label="Statut convocation"
            value={draft.statuts}
            onChange={(e) => onDraftChange({ statuts: e.target.value as ConvocationStatut[] })}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {(selected as ConvocationStatut[]).map((v) => (
                  <Chip
                    key={v}
                    label={STATUT_OPTIONS.find((o) => o.value === v)?.label ?? v}
                    size="small"
                  />
                ))}
              </Box>
            )}
          >
            {STATUT_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                <Checkbox checked={draft.statuts.includes(o.value)} />
                <ListItemText primary={o.label} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          select
          size="small"
          label="Type convocation"
          value={draft.convocationType}
          sx={field20}
          onChange={(e) => onDraftChange({ convocationType: e.target.value as any })}
        >
          <MenuItem value="">Tous</MenuItem>
          <MenuItem value="INITIALE">Initiale</MenuItem>
          <MenuItem value="RELANCE_1">Relance 1</MenuItem>
          <MenuItem value="RELANCE_2">Relance 2</MenuItem>
          <MenuItem value="RELANCE_3">Relance 3</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="État (optionnel)"
          value={draft.etat}
          sx={field20}
          onChange={(e) => onDraftChange({ etat: e.target.value as any })}
        >
          <MenuItem value="">Tous</MenuItem>
          <MenuItem value="A_CONVOQUER">À convoquer</MenuItem>
          <MenuItem value="CONVOQUE">Convoqué</MenuItem>
          <MenuItem value="RELANCE">Relancé</MenuItem>
        </TextField>

        {/* Dates convocation */}
        <TextField
          size="small"
          type="date"
          label="Convocation du"
          slotProps={{ inputLabel: { shrink: true } }}
          value={draft.dateConvocFrom}
          sx={field20}
          onChange={(e) => onDraftChange({ dateConvocFrom: e.target.value })}
        />
        <TextField
          size="small"
          type="date"
          label="Convocation au"
          slotProps={{ inputLabel: { shrink: true } }}
          value={draft.dateConvocTo}
          sx={field20}
          onChange={(e) => onDraftChange({ dateConvocTo: e.target.value })}
        />

        {/* Dates visite prévue */}
        <TextField
          size="small"
          type="date"
          label="Visite prévue du"
          slotProps={{ inputLabel: { shrink: true } }}
          value={draft.datePrevueFrom}
          sx={field20}
          onChange={(e) => onDraftChange({ datePrevueFrom: e.target.value })}
        />
        <TextField
          size="small"
          type="date"
          label="Visite prévue au"
          slotProps={{ inputLabel: { shrink: true } }}
          value={draft.datePrevueTo}
          sx={field20}
          onChange={(e) => onDraftChange({ datePrevueTo: e.target.value })}
        />

        {/* Dates visite réalisée */}
        <TextField
          size="small"
          type="date"
          label="Visite réalisée du"
          slotProps={{ inputLabel: { shrink: true } }}
          value={draft.dateVisiteRealiseeFrom}
          sx={field20}
          onChange={(e) => onDraftChange({ dateVisiteRealiseeFrom: e.target.value })}
        />
        <TextField
          size="small"
          type="date"
          label="Visite réalisée au"
          slotProps={{ inputLabel: { shrink: true } }}
          value={draft.dateVisiteRealiseeTO}
          sx={field20}
          onChange={(e) => onDraftChange({ dateVisiteRealiseeTO: e.target.value })}
        />

        {/* Actions */}
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
          <Button variant="contained" startIcon={<SearchIcon />} onClick={onSearch}>
            Rechercher
          </Button>
          <Button variant="outlined" color="secondary" startIcon={<ClearIcon />} onClick={onReset}>
            Vider
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
