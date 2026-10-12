"use client";

// 3.2 Antécédents familiaux médico-chirurgicaux (codage CIM-11)
import { Box, Button, IconButton, Paper, Stack, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import {
  ajouterMembreFratrie,
  membresParDefaut,
  type MembreFamille,
  type PathologieCodee,
} from "@/lib/clinique/antecedents";
import Cim11Field from "../Cim11Field";

const DEFAUT_IDS = new Set(membresParDefaut().map((m) => m.id));

export default function AntecedentsFamiliaux({
  value,
  onChange,
  readOnly = false,
}: {
  value: MembreFamille[] | undefined;
  onChange: (next: MembreFamille[]) => void;
  readOnly?: boolean;
}) {
  const membres = value && value.length ? value : membresParDefaut();

  const updateMembre = (id: string, patch: (m: MembreFamille) => MembreFamille) =>
    onChange(membres.map((m) => (m.id === id ? patch(m) : m)));

  const updatePathologie = (id: string, index: number, patch: Partial<PathologieCodee>) =>
    updateMembre(id, (m) => ({
      ...m,
      pathologies: m.pathologies.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));

  return (
    <Box>
      <Stack spacing={1.5}>
        {membres.map((m) => (
          <Paper key={m.id} variant="outlined" sx={{ p: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Typography fontWeight={600}>{m.libelle}</Typography>
              <Box>
                {!readOnly && (
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() =>
                      updateMembre(m.id, (x) => ({
                        ...x,
                        pathologies: [...x.pathologies, { cim11Code: "", cim11Libelle: "", commentaire: "" }],
                      }))
                    }
                  >
                    Antécédent
                  </Button>
                )}
                {!readOnly && !DEFAUT_IDS.has(m.id) && (
                  <IconButton
                    size="small"
                    color="error"
                    aria-label={`Retirer ${m.libelle}`}
                    onClick={() => onChange(membres.filter((x) => x.id !== m.id))}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>

            {m.pathologies.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Aucun antécédent renseigné.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {m.pathologies.map((p, i) => (
                  <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                    <Cim11Field
                      disabled={readOnly}
                      value={p.cim11Code ? { code: p.cim11Code, libelle: p.cim11Libelle } : null}
                      onChange={(v) => updatePathologie(m.id, i, { cim11Code: v?.code ?? "", cim11Libelle: v?.libelle ?? "" })}
                    />
                    <TextField
                      size="small"
                      placeholder="Commentaire"
                      disabled={readOnly}
                      sx={{ width: 240 }}
                      value={p.commentaire ?? ""}
                      onChange={(e) => updatePathologie(m.id, i, { commentaire: e.target.value })}
                    />
                    {!readOnly && (
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Supprimer l'antécédent"
                        onClick={() =>
                          updateMembre(m.id, (x) => ({ ...x, pathologies: x.pathologies.filter((_, j) => j !== i) }))
                        }
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        ))}
      </Stack>

      {!readOnly && (
        <Button startIcon={<PersonAddAltIcon />} sx={{ mt: 1 }} onClick={() => onChange(ajouterMembreFratrie(membres))}>
          Ajouter un membre de la fratrie
        </Button>
      )}
    </Box>
  );
}
