"use client";

import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Autocomplete,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

import type { ChangeHandler, Cim11Option, FormData, PathologieItem } from "../types";

// ✅ Exemples (mock) depuis ton référentiel CIM11 (tu remplaceras par fetch API)
// Idéalement: autocomplete via /api/cim11/search?q=...
const CIM11_EXAMPLES: Cim11Option[] = [
  { id: "1", code: "2A00.10", libelle: "Médulloblastome du cerveau" },
  { id: "2", code: "2A00.0", libelle: "Gliomes du cerveau" },
  { id: "3", code: "BlockL2-1B1", libelle: "Tuberculose" },
  { id: "4", code: "BlockL2-1A6", libelle: "Syphilis" },
  { id: "5", code: "BlockL1-1D2", libelle: "Dengue" },
];

function optionLabel(o: Cim11Option) {
  return `${o.code} — ${o.libelle}`;
}

function emptyRow(): PathologieItem {
  return {
    cim11Code: "",
    cim11Libelle: "",
    date: "",
    commentaire: "",
  };
}

export default function AntecedentsSection({
  data,
  onChange,
}: {
  data: FormData;
  onChange: ChangeHandler;
}) {
  const history = data.pathologiesHistory ?? [];
  const toAdd = data.pathologiesToAdd ?? [];

  const addRow = () => {
    onChange("pathologiesToAdd", [...toAdd, emptyRow()]);
  };

  const removeRow = (idx: number) => {
    onChange(
      "pathologiesToAdd",
      toAdd.filter((_, i) => i !== idx)
    );
  };

  const updateRow = (idx: number, patch: Partial<PathologieItem>) => {
    const next = toAdd.map((row, i) => (i === idx ? { ...row, ...patch } : row));
    onChange("pathologiesToAdd", next);
  };

  return (
    <Stack spacing={3}>
      {/* ===== TABLE 1: Historique ===== */}
      <Box>
        <Typography variant="h6" mb={1}>
          Historique des pathologies
        </Typography>

        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Pathologie (CIM-11)</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Commentaire</TableCell>
                <TableCell>Source</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2" color="text.secondary">
                      Aucune pathologie enregistrée.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                history.map((p, i) => (
                  <TableRow key={`${p.cim11Code}-${p.date}-${i}`}>
                    <TableCell>{p.cim11Code ? `${p.cim11Code} — ${p.cim11Libelle}` : "—"}</TableCell>
                    <TableCell>{p.date || "—"}</TableCell>
                    <TableCell>{p.commentaire || "—"}</TableCell>
                    <TableCell>{p.source || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      </Box>

      {/* ===== TABLE 2: Ajout ===== */}
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="h6">Ajouter des pathologies</Typography>
          <Button startIcon={<AddIcon />} variant="contained" onClick={addRow}>
            Ajouter
          </Button>
        </Stack>

        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: "45%" }}>Pathologie (CIM-11)</TableCell>
                <TableCell sx={{ width: 160 }}>Date</TableCell>
                <TableCell>Commentaire</TableCell>
                <TableCell sx={{ width: 60 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {toAdd.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2" color="text.secondary">
                      Clique sur “Ajouter” pour insérer une pathologie depuis le référentiel CIM-11.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                toAdd.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Autocomplete<Cim11Option, false, false, false>
                        options={CIM11_EXAMPLES}
                        getOptionLabel={optionLabel}
                        value={
                          row.cim11Code
                            ? {
                                id: `${row.cim11Code}`,
                                code: row.cim11Code,
                                libelle: row.cim11Libelle,
                              }
                            : null
                        }
                        onChange={(_, opt) => {
                          updateRow(idx, {
                            cim11Code: opt?.code ?? "",
                            cim11Libelle: opt?.libelle ?? "",
                          });
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Ex: 2A00.10 — Médulloblastome du cerveau"
                            size="small"
                          />
                        )}
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        size="small"
                        type="date"
                        value={row.date || ""}
                        onChange={(e) => updateRow(idx, { date: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        size="small"
                        value={row.commentaire || ""}
                        onChange={(e) => updateRow(idx, { commentaire: e.target.value })}
                        placeholder="Ex: diagnostic confirmé / sous traitement..."
                        fullWidth
                      />
                    </TableCell>

                    <TableCell align="right">
                      <IconButton aria-label="supprimer" onClick={() => removeRow(idx)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>

        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          (Les options CIM-11 sont des exemples. Tu remplaceras par une recherche API sur ton référentiel.)
        </Typography>
      </Box>

      {/* ===== Champ texte ===== */}
      <TextField
        fullWidth
        multiline
        rows={6}
        label="Antécédents (médicaux, chirurgicaux, allergies, traitements...)"
        value={data.antecedents}
        onChange={(e) => onChange("antecedents", e.target.value)}
      />
    </Stack>
  );
}