"use client";

import {
  Box, Button, Divider, IconButton, Paper, Stack,
  Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";

import type { ChangeHandler, FormData, PathologieItem } from "../types";
import Cim11Field from "../Cim11Field";
import AntecedentsFamiliaux from "./AntecedentsFamiliaux";
import SectionRenderer from "@/app/formulaires/examen/components/SectionRenderer";
import { ANTECEDENTS_PROFESSIONNELS } from "@/app/formulaires/examen/config/antecedentsProfessionnels";
import { genererSyntheseAntecedents } from "@/lib/clinique/antecedents";

function emptyRow(): PathologieItem {
  return { cim11Code: "", cim11Libelle: "", date: "", commentaire: "" };
}

export default function AntecedentsSection({
  data,
  onChange,
  readOnly = false,
}: {
  data: FormData;
  onChange: ChangeHandler;
  readOnly?: boolean;
}) {
  const history = data.pathologiesHistory ?? [];
  const toAdd = data.pathologiesToAdd ?? [];

  const addRow = () => onChange("pathologiesToAdd", [...toAdd, emptyRow()]);
  const removeRow = (idx: number) => onChange("pathologiesToAdd", toAdd.filter((_, i) => i !== idx));
  const updateRow = (idx: number, patch: Partial<PathologieItem>) =>
    onChange("pathologiesToAdd", toAdd.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  const genererSynthese = () => {
    const texte = genererSyntheseAntecedents({
      pathologies: [...history, ...toAdd],
      chirurgicaux: data.antecedentsChirurgicaux,
      familiaux: data.antecedentsFamiliaux,
      professionnels: data.antecedentsProfessionnels,
    });
    if (data.antecedents?.trim() && !window.confirm("Remplacer la synthèse actuelle par une synthèse générée ?")) return;
    onChange("antecedents", texte);
  };

  return (
    <Stack spacing={3}>
      {/* ── 3.1 Antécédents personnels ── */}
      <Typography variant="h6">Antécédents personnels</Typography>

      <Box>
        <Typography variant="subtitle1" fontWeight={600} mb={1}>Historique des pathologies</Typography>
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
                    <Typography variant="body2" color="text.secondary">Aucune pathologie enregistrée.</Typography>
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

      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="subtitle1" fontWeight={600}>Antécédents médicaux (CIM-11)</Typography>
          {!readOnly && (
            <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={addRow}>
              Ajouter
            </Button>
          )}
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
                      Cliquez sur « Ajouter » pour insérer une pathologie depuis le référentiel CIM-11.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                toAdd.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Cim11Field
                        disabled={readOnly}
                        value={row.cim11Code ? { code: row.cim11Code, libelle: row.cim11Libelle } : null}
                        onChange={(v) => updateRow(idx, { cim11Code: v?.code ?? "", cim11Libelle: v?.libelle ?? "" })}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small" type="date" fullWidth disabled={readOnly}
                        value={row.date || ""}
                        onChange={(e) => updateRow(idx, { date: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small" fullWidth disabled={readOnly}
                        value={row.commentaire || ""}
                        onChange={(e) => updateRow(idx, { commentaire: e.target.value })}
                        placeholder="Ex: diagnostic confirmé / sous traitement..."
                      />
                    </TableCell>
                    <TableCell align="right">
                      {!readOnly && (
                        <IconButton aria-label="supprimer" onClick={() => removeRow(idx)}>
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          Seules les entrées terminales (feuilles) du référentiel CIM-11 sont sélectionnables.
        </Typography>
      </Box>

      <TextField
        fullWidth multiline minRows={3} disabled={readOnly}
        label="Antécédents chirurgicaux (interventions)"
        value={data.antecedentsChirurgicaux ?? ""}
        onChange={(e) => onChange("antecedentsChirurgicaux", e.target.value)}
      />

      <Divider />

      {/* ── 3.2 Antécédents familiaux ── */}
      <Box>
        <Typography variant="h6" mb={1}>Antécédents familiaux médico-chirurgicaux</Typography>
        <AntecedentsFamiliaux
          readOnly={readOnly}
          value={data.antecedentsFamiliaux}
          onChange={(next) => onChange("antecedentsFamiliaux", next)}
        />
      </Box>

      <Divider />

      {/* ── 3.3 Antécédents professionnels ── */}
      <Box>
        <Typography variant="h6" mb={1}>Antécédents professionnels</Typography>
        <SectionRenderer
          section={ANTECEDENTS_PROFESSIONNELS}
          champPrefix="antecedents"
          ctx={{ readOnly }}
          values={data.antecedentsProfessionnels}
          onChange={(next) => onChange("antecedentsProfessionnels", next)}
        />
      </Box>

      <Divider />

      {/* ── Synthèse (générée puis modifiable) ── */}
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="h6">Synthèse des antécédents</Typography>
          {!readOnly && (
            <Button startIcon={<AutoFixHighIcon />} variant="outlined" size="small" onClick={genererSynthese}>
              Générer la synthèse
            </Button>
          )}
        </Stack>
        <TextField
          fullWidth multiline minRows={4} disabled={readOnly}
          placeholder="Cliquez sur « Générer la synthèse » : le texte est construit à partir des champs ci-dessus, puis reste modifiable."
          value={data.antecedents}
          onChange={(e) => onChange("antecedents", e.target.value)}
        />
      </Box>
    </Stack>
  );
}
