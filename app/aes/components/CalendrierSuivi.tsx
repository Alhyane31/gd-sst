"use client";

// Section 10 : calendrier de suivi (dates générées à la validation, modifiables) et bilans prévus par visite.
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useEffect, useState } from "react";
import { estPasDAes, BILAN_LIBELLES, BILANS, SUIVI_LIBELLES, SUIVI_STATUT_LIBELLES, SUIVI_STATUTS, type SuiviCode } from "@/lib/aes/codes";
import type { DeclarationApi, SuiviApi } from "../types";

type Ligne = { code: string; datePrevue: string; statut: string; bilans: string[] };

const versLignes = (suivis: SuiviApi[]): Ligne[] =>
  suivis.map((s) => ({ code: s.code, datePrevue: s.datePrevue.slice(0, 10), statut: s.statut, bilans: s.bilans }));

export default function CalendrierSuivi({
  visiteId,
  declaration,
  onSaved,
}: {
  visiteId: string;
  declaration: DeclarationApi | null;
  onSaved: (d: DeclarationApi) => void;
}) {
  const [lignes, setLignes] = useState<Ligne[]>(versLignes(declaration?.suivis ?? []));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ severite: "success" | "error"; texte: string } | null>(null);

  useEffect(() => setLignes(versLignes(declaration?.suivis ?? [])), [declaration?.suivis]);

  if (!declaration || declaration.statut === "BROUILLON") {
    return <Alert severity="info">Le calendrier de suivi est généré à la validation de la déclaration.</Alert>;
  }
  const readOnly = declaration.statut === "CLOTUREE";
  if (estPasDAes(declaration.data ?? {}) && lignes.length === 0) {
    return <Alert severity="info">Ne correspond pas à la définition d&apos;un AES : lavage simple, pas de suivi. Le dossier peut être clôturé.</Alert>;
  }

  const maj = (code: string, patch: Partial<Ligne>) => setLignes((ls) => ls.map((l) => (l.code === code ? { ...l, ...patch } : l)));

  const envoyer = async (body: unknown) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/aes/${visiteId}/suivis`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message ?? "Erreur lors de l'enregistrement");
      onSaved(payload.declaration);
      setMessage({ severite: "success", texte: "Calendrier enregistré." });
    } catch (e: unknown) {
      setMessage({ severite: "error", texte: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Dates générées à la validation (J1–J7 = J0 + 7, S2 = J0 + 14, S6 = J0 + 42, S12 = J0 + 84 ; J0 = date de l&apos;AES) et
        bilans pré-cochés selon l&apos;annexe E. Tout reste modifiable.
      </Typography>

      <Paper variant="outlined" sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Visite</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Date prévue</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Statut</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Bilans prévus</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lignes.map((l) => (
              <TableRow key={l.code}>
                <TableCell sx={{ fontWeight: 600 }}>{SUIVI_LIBELLES[l.code as SuiviCode] ?? l.code}</TableCell>
                <TableCell>
                  <TextField
                    type="date"
                    size="small"
                    disabled={readOnly}
                    value={l.datePrevue}
                    onChange={(e) => maj(l.code, { datePrevue: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <TextField select size="small" sx={{ minWidth: 150 }} disabled={readOnly} value={l.statut} onChange={(e) => maj(l.code, { statut: e.target.value })}>
                    {SUIVI_STATUTS.map((s) => (
                      <MenuItem key={s} value={s}>
                        {SUIVI_STATUT_LIBELLES[s]}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell>
                  {BILANS.map((b) => (
                    <FormControlLabel
                      key={b}
                      label={BILAN_LIBELLES[b]}
                      disabled={readOnly}
                      control={
                        <Checkbox
                          size="small"
                          checked={l.bilans.includes(b)}
                          onChange={() => maj(l.code, { bilans: l.bilans.includes(b) ? l.bilans.filter((x) => x !== b) : [...l.bilans, b] })}
                        />
                      }
                    />
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {message && (
        <Alert severity={message.severite} sx={{ mt: 2 }}>
          {message.texte}
        </Alert>
      )}

      {!readOnly && (
        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
          <Button
            startIcon={<RestartAltIcon />}
            disabled={saving}
            onClick={() => {
              if (window.confirm("Recalculer dates et bilans à partir de la déclaration ? Les modifications manuelles seront remplacées.")) {
                envoyer({ action: "regenerer" });
              }
            }}
          >
            Recalculer depuis la déclaration
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} disabled={saving} onClick={() => envoyer({ suivis: lignes })}>
            Enregistrer le calendrier
          </Button>
        </Stack>
      )}
    </Box>
  );
}
