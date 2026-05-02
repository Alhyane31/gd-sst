"use client";

import {
  Box, Button, CircularProgress, IconButton, Paper, Stack,
  Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography, Autocomplete,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useEffect, useState } from "react";

import type { ChangeHandler, Cim11Option, FormData, PathologieItem } from "../types";

function optionLabel(o: Cim11Option) {
  return `${o.code} — ${o.libelle}`;
}

function emptyRow(): PathologieItem {
  return { cim11Code: "", cim11Libelle: "", date: "", commentaire: "" };
}

const LEVEL_INDENT: Record<string, number> = {
  L1: 8, L2: 16, L3: 24, L4: 32, L5: 40,
};

export default function AntecedentsSection({
  data,
  onChange,
}: {
  data: FormData;
  onChange: ChangeHandler;
}) {
  const history = data.pathologiesHistory ?? [];
  const toAdd = data.pathologiesToAdd ?? [];

  // ✅ options et search par index de ligne
  const [cim11Options, setCim11Options] = useState<Record<number, Cim11Option[]>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [searchTexts, setSearchTexts] = useState<Record<number, string>>({});

  const addRow = () => {
    onChange("pathologiesToAdd", [...toAdd, emptyRow()]);
  };

  const removeRow = (idx: number) => {
    onChange("pathologiesToAdd", toAdd.filter((_, i) => i !== idx));
    // nettoyage du state local
    setSearchTexts((prev) => { const n = { ...prev }; delete n[idx]; return n; });
    setCim11Options((prev) => { const n = { ...prev }; delete n[idx]; return n; });
    setLoading((prev) => { const n = { ...prev }; delete n[idx]; return n; });
  };

  const updateRow = (idx: number, patch: Partial<PathologieItem>) => {
    onChange("pathologiesToAdd", toAdd.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  useEffect(() => {
    const controllers: AbortController[] = [];

    const fetches = Object.entries(searchTexts).map(async ([idxStr, q]) => {
      const idx = Number(idxStr);
      const controller = new AbortController();
      controllers.push(controller);

      setLoading((prev) => ({ ...prev, [idx]: true }));

      try {
        const params = new URLSearchParams({ pageSize: "20" });
        if (q.trim()) params.set("q", q.trim());

        const res = await fetch(`/api/cim11?${params}`, { signal: controller.signal });
        const payload = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(payload?.message ?? "Erreur chargement CIM-11");

        const items: Cim11Option[] = (payload?.items ?? []).map((item: any) => ({
          id: item.id,
          code: item.code,
          libelle: item.libelle,
          isLeaf: item.isLeaf,
          level: item.level,
        }));

        setCim11Options((prev) => ({ ...prev, [idx]: items }));
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error("Erreur CIM-11:", e);
          setCim11Options((prev) => ({ ...prev, [idx]: [] }));
        }
      } finally {
        setLoading((prev) => ({ ...prev, [idx]: false }));
      }
    });

    return () => controllers.forEach((c) => c.abort());
  }, [searchTexts]);

  return (
    <Stack spacing={3}>
      {/* Historique */}
      <Box>
        <Typography variant="h6" mb={1}>Historique des pathologies</Typography>
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

      {/* Ajout */}
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
                      Cliquez sur "Ajouter" pour insérer une pathologie depuis le référentiel CIM-11.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                toAdd.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Autocomplete<Cim11Option, false, false, false>
                        options={cim11Options[idx] ?? []}
                        loading={loading[idx] ?? false}
                        filterOptions={(x) => x}
                        getOptionLabel={optionLabel}
                        isOptionEqualToValue={(opt, val) => opt.code === val.code}
                        

                        renderOption={(props, option) => (
  <li
    {...props}
    key={option.id}
    style={{
      paddingLeft: LEVEL_INDENT[option.level] ?? 8,
      opacity: option.isLeaf ? 1 : 0.85,
      pointerEvents: option.isLeaf ? "auto" : "none", // non-cliquable mais visible
      fontSize: option.isLeaf ? "0.875rem" : "0.78rem",
      fontWeight: option.isLeaf ? 400 : 600,
      color: option.isLeaf ? "inherit" : "#666",
      borderTop: option.level === "L1" ? "1px solid #eee" : "none",
    }}
  >
    {option.code} — {option.libelle}
  </li>
)}



                        value={
                          row.cim11Code
                            ? { id: row.cim11Code, code: row.cim11Code, libelle: row.cim11Libelle, isLeaf: true, level: "" }
                            : null
                        }

                        onInputChange={(_, value) =>
                          setSearchTexts((prev) => ({ ...prev, [idx]: value }))
                        }

                        onChange={(_, opt) => {
                          if (!opt?.isLeaf) return;
                          updateRow(idx, { cim11Code: opt.code, cim11Libelle: opt.libelle });
                        }}

                        noOptionsText="Aucune pathologie trouvée"
                        loadingText="Chargement..."

                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Rechercher une pathologie CIM-11"
                            size="small"
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {loading[idx] ? <CircularProgress size={16} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        size="small" type="date"
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
          Seules les entrées terminales (feuilles) du référentiel CIM-11 sont sélectionnables.
        </Typography>
      </Box>

      <TextField
        fullWidth multiline rows={6}
        label="Antécédents (médicaux, chirurgicaux, allergies, traitements...)"
        value={data.antecedents}
        onChange={(e) => onChange("antecedents", e.target.value)}
      />
    </Stack>
  );
}