"use client";

import { Box, Button, MenuItem, Paper, Stack, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { Formation, Poste, Service, VisitesFilters } from "../types";

type Props = {
  postes: Poste[];
  formations: Formation[];
  services: Service[];

  draft: VisitesFilters;
  onDraftChange: (patch: Partial<VisitesFilters>) => void;

  onSearch: () => void;
  onReset: () => void;
};

export default function VisitesFiltersBar({
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
      <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" alignItems="center">
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
            <MenuItem key={p.id} value={p.id}>
              {p.libelle}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Formation"
          value={draft.formationId}
          sx={field20}
          onChange={(e) =>
            onDraftChange({
              formationId: e.target.value,
              serviceId: "", // reset service si formation change
            })
          }
        >
          <MenuItem value="">Toutes</MenuItem>
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
          value={draft.serviceId}
          disabled={!draft.formationId}
          sx={field20}
          onChange={(e) => onDraftChange({ serviceId: e.target.value })}
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
          label="Catégorie"
          value={draft.categorie}
          sx={field20}
          onChange={(e) => onDraftChange({ categorie: e.target.value as any })}
        >
          <MenuItem value="">Toutes</MenuItem>
          <MenuItem value="VP">VP</MenuItem>
          <MenuItem value="SMR">SMR</MenuItem>
        </TextField>

        <TextField
          size="small"
          label="Tag (exact)"
          value={draft.tag}
          placeholder='Ex: "Femme enceinte"'
          sx={field20}
          onChange={(e) => onDraftChange({ tag: e.target.value })}
        />

        {/* Visite */}
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

        <TextField
          select
          size="small"
          label="Statut visite"
          value={draft.statut}
          sx={field20}
          onChange={(e) => onDraftChange({ statut: e.target.value as any })}
        >
          <MenuItem value="">Tous</MenuItem>
          <MenuItem value="A_CONVOQUER">À convoquer</MenuItem>
          <MenuItem value="CONVOCATION_GENEREE">Convocation générée</MenuItem>
          <MenuItem value="A_TRAITER">À traiter</MenuItem>
          <MenuItem value="A_RELANCER">À relancer</MenuItem>
          <MenuItem value="RELANCEE">Relancé</MenuItem>
          <MenuItem value="REALISEE">Réalisé</MenuItem>
        </TextField>

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
          label="Présence"
          value={draft.presence}
          sx={field20}
          onChange={(e) => onDraftChange({ presence: e.target.value as any })}
        >
          <MenuItem value="">Tous</MenuItem>
          <MenuItem value="PRESENT">Présent</MenuItem>
          <MenuItem value="ABSENT">Absent</MenuItem>
          <MenuItem value="EXCUSE">Excusé</MenuItem>
          <MenuItem value="INCONNU">Inconnu</MenuItem>
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

        {/* Dates */}
        <TextField
          size="small"
          type="date"
          label="Convocation du"
          InputLabelProps={{ shrink: true }}
          value={draft.dateConvocFrom}
          sx={field20}
          onChange={(e) => onDraftChange({ dateConvocFrom: e.target.value })}
        />
        <TextField
          size="small"
          type="date"
          label="Convocation au"
          InputLabelProps={{ shrink: true }}
          value={draft.dateConvocTo}
          sx={field20}
          onChange={(e) => onDraftChange({ dateConvocTo: e.target.value })}
        />
        <TextField
          size="small"
          type="date"
          label="Visite du"
          InputLabelProps={{ shrink: true }}
          value={draft.dateVisiteFrom}
          sx={field20}
          onChange={(e) => onDraftChange({ dateVisiteFrom: e.target.value })}
        />
        <TextField
          size="small"
          type="date"
          label="Visite au"
          InputLabelProps={{ shrink: true }}
          value={draft.dateVisiteTo}
          sx={field20}
          onChange={(e) => onDraftChange({ dateVisiteTo: e.target.value })}
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
