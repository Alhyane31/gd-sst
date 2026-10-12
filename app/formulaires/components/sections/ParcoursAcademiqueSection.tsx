"use client";

import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type {
  AutreDiplome,
  ChangeHandler,
  DiplomePostBac,
  FormData,
  NiveauDiplome,
} from "../types";

const NIVEAUX: { value: Exclude<NiveauDiplome, "">; label: string }[] = [
  { value: "BAC_2", label: "Bac+2" },
  { value: "BAC_3", label: "Bac+3" },
  { value: "BAC_4", label: "Bac+4" },
  { value: "BAC_5", label: "Bac+5" },
  { value: "BAC_6", label: "Bac+6" },
  { value: "BAC_7_PLUS", label: "Bac+7 et plus" },
];

// Année : chiffres uniquement, 4 max
const onlyYear = (value: string) => value.replace(/\D/g, "").slice(0, 4);

const yearInputProps = { inputMode: "numeric" as const, pattern: "[0-9]*", maxLength: 4 };

const rowSx = { display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", mb: 1.5 };
const diplomeSx = { flex: "1 1 480px", minWidth: 480 };
const anneeSx = { width: 120 };

export default function ParcoursAcademiqueSection({
  data,
  onChange,
}: {
  data: FormData;
  onChange: ChangeHandler;
}) {
  const diplomesPostBac = data.diplomesPostBac ?? [];
  const autresDiplomes = data.autresDiplomes ?? [];

  // ── Diplômes post-bac ──
  const updatePostBac = (index: number, patch: Partial<DiplomePostBac>) =>
    onChange(
      "diplomesPostBac",
      diplomesPostBac.map((d, i) => (i === index ? { ...d, ...patch } : d))
    );
  const addPostBac = () =>
    onChange("diplomesPostBac", [...diplomesPostBac, { niveau: "", diplome: "", annee: "" }]);
  const removePostBac = (index: number) =>
    onChange("diplomesPostBac", diplomesPostBac.filter((_, i) => i !== index));

  // ── Autres diplômes ──
  const updateAutre = (index: number, patch: Partial<AutreDiplome>) =>
    onChange(
      "autresDiplomes",
      autresDiplomes.map((d, i) => (i === index ? { ...d, ...patch } : d))
    );
  const addAutre = () =>
    onChange("autresDiplomes", [...autresDiplomes, { diplome: "", annee: "" }]);
  const removeAutre = (index: number) =>
    onChange("autresDiplomes", autresDiplomes.filter((_, i) => i !== index));

  return (
    <Box>
      {/* Baccalauréat */}
      <Typography variant="h6" mb={1}>
        Baccalauréat
      </Typography>

      <RadioGroup
        row
        value={data.bacObtenu ?? ""}
        onChange={(e) => {
          const value = e.target.value as FormData["bacObtenu"];
          onChange("bacObtenu", value);
          if (value === "non") {
            onChange("bacAnnee", "");
            onChange("bacOption", "");
            onChange("bacLieu", "");
          }
        }}
      >
        <FormControlLabel value="oui" control={<Radio />} label="Oui" />
        <FormControlLabel value="non" control={<Radio />} label="Non" />
      </RadioGroup>

      {data.bacObtenu === "oui" && (
        <Box sx={{ ...rowSx, mt: 1 }}>
          <TextField
            label="Année"
            sx={anneeSx}
            inputProps={yearInputProps}
            value={data.bacAnnee ?? ""}
            onChange={(e) => onChange("bacAnnee", onlyYear(e.target.value))}
          />
          <TextField
            label="Option"
            sx={{ flex: "1 1 220px" }}
            value={data.bacOption ?? ""}
            onChange={(e) => onChange("bacOption", e.target.value)}
          />
          <TextField
            label="Lieu"
            sx={{ flex: "1 1 220px" }}
            value={data.bacLieu ?? ""}
            onChange={(e) => onChange("bacLieu", e.target.value)}
          />
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Diplômes post-bac */}
      <Typography variant="h6" mb={1}>
        Diplômes post-bac
      </Typography>

      {diplomesPostBac.length === 0 && (
        <Typography variant="body2" color="text.secondary" mb={1}>
          Aucun diplôme post-bac ajouté.
        </Typography>
      )}

      {diplomesPostBac.map((d, index) => (
        <Box key={index} sx={rowSx}>
          <TextField
            select
            label="Niveau"
            sx={{ width: 180 }}
            value={d.niveau}
            onChange={(e) => updatePostBac(index, { niveau: e.target.value as NiveauDiplome })}
          >
            <MenuItem value="">Sélectionner</MenuItem>
            {NIVEAUX.map((n) => (
              <MenuItem key={n.value} value={n.value}>
                {n.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Diplôme"
            sx={diplomeSx}
            value={d.diplome}
            onChange={(e) => updatePostBac(index, { diplome: e.target.value })}
          />
          <TextField
            label="Année"
            sx={anneeSx}
            inputProps={yearInputProps}
            value={d.annee}
            onChange={(e) => updatePostBac(index, { annee: onlyYear(e.target.value) })}
          />
          <IconButton color="error" onClick={() => removePostBac(index)} aria-label="Supprimer">
            <DeleteOutlineIcon />
          </IconButton>
        </Box>
      ))}

      <Button startIcon={<AddIcon />} onClick={addPostBac} sx={{ mt: 1 }}>
        Ajouter un diplôme post-bac
      </Button>

      <Divider sx={{ my: 3 }} />

      {/* Autres diplômes */}
      <Typography variant="h6" mb={1}>
        Autres diplômes
      </Typography>

      {autresDiplomes.length === 0 && (
        <Typography variant="body2" color="text.secondary" mb={1}>
          Aucun autre diplôme ajouté.
        </Typography>
      )}

      {autresDiplomes.map((d, index) => (
        <Box key={index} sx={rowSx}>
          <TextField
            label="Diplôme"
            sx={diplomeSx}
            value={d.diplome}
            onChange={(e) => updateAutre(index, { diplome: e.target.value })}
          />
          <TextField
            label="Année"
            sx={anneeSx}
            inputProps={yearInputProps}
            value={d.annee}
            onChange={(e) => updateAutre(index, { annee: onlyYear(e.target.value) })}
          />
          <IconButton color="error" onClick={() => removeAutre(index)} aria-label="Supprimer">
            <DeleteOutlineIcon />
          </IconButton>
        </Box>
      ))}

      <Button startIcon={<AddIcon />} onClick={addAutre} sx={{ mt: 1 }}>
        Ajouter un autre diplôme
      </Button>
    </Box>
  );
}
