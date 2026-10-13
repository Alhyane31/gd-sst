"use client";

// Paramétrage du référentiel AES : le protocole du P23 prime sur les valeurs de la spécification.
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
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
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveIcon from "@mui/icons-material/Save";
import { useEffect, useState } from "react";
import { BILAN_LIBELLES, BILANS, SUIVI_LIBELLES, type Bilan } from "@/lib/aes/codes";
import { CONDITIONS_BILAN, type ConditionBilan, type ReferentielAes, type SchemaTpe } from "@/lib/aes/referentiel";

type Cle = "schemasTpe" | "calendrier" | "seuils" | "annexes";

export default function ReferentielAesPage() {
  const [ref, setRef] = useState<ReferentielAes | null>(null);
  const [annexesJson, setAnnexesJson] = useState("");
  const [message, setMessage] = useState<{ severite: "success" | "error"; texte: string } | null>(null);

  const charger = (r: ReferentielAes) => {
    setRef(r);
    setAnnexesJson(JSON.stringify(r.annexes, null, 2));
  };

  useEffect(() => {
    fetch("/api/aes/referentiel")
      .then((r) => r.json())
      .then(charger)
      .catch(() => setMessage({ severite: "error", texte: "Erreur de chargement" }));
  }, []);

  if (!ref) return <Box p={4} textAlign="center"><CircularProgress /></Box>;

  const enregistrer = async (cle: Cle, valeur: unknown) => {
    setMessage(null);
    const res = await fetch("/api/aes/referentiel", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [cle]: valeur }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) return setMessage({ severite: "error", texte: payload?.message ?? "Erreur" });
    charger(payload);
    setMessage({ severite: "success", texte: "Référentiel enregistré." });
  };

  const majSchema = (i: number, patch: Partial<SchemaTpe>) =>
    setRef({ ...ref, schemasTpe: ref.schemasTpe.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

  const majVisite = (code: string, patch: Partial<ReferentielAes["calendrier"][number]>) =>
    setRef({ ...ref, calendrier: ref.calendrier.map((v) => (v.code === code ? { ...v, ...patch } : v)) });

  return (
    <Box p={2}>
      <Typography variant="h5" fontWeight={700} mb={1}>
        Référentiel AES
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Valeurs initiales reprises des annexes de la spécification. Le protocole du P23 et les recommandations nationales priment :
        adaptez ici les schémas de TPE, le calendrier de suivi, les seuils et les textes d&apos;aide.
      </Typography>
      {message && <Alert severity={message.severite} sx={{ mb: 2 }}>{message.texte}</Alert>}

      {/* Seuils */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" mb={1}>Seuils</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <TextField
            type="number"
            size="small"
            label="Délai maximal du TPE VIH (heures)"
            value={ref.seuils.delaiTpeHeures}
            onChange={(e) => setRef({ ...ref, seuils: { ...ref.seuils, delaiTpeHeures: Number(e.target.value) } })}
          />
          <TextField
            type="number"
            size="small"
            label="Anti-HBs : répondeur si ≥ (mUI/mL)"
            value={ref.seuils.antiHbsRepondeur}
            onChange={(e) => setRef({ ...ref, seuils: { ...ref.seuils, antiHbsRepondeur: Number(e.target.value) } })}
          />
          <TextField
            type="number"
            size="small"
            label="Rappel à la victime (jours avant la visite)"
            helperText="Envoi non actif : aucun canal e-mail / SMS configuré"
            value={ref.seuils.rappelJoursAvant}
            onChange={(e) => setRef({ ...ref, seuils: { ...ref.seuils, rappelJoursAvant: Number(e.target.value) } })}
          />
          <Button variant="contained" startIcon={<SaveIcon />} onClick={() => enregistrer("seuils", ref.seuils)}>
            Enregistrer
          </Button>
        </Stack>
      </Paper>

      {/* Schémas de TPE */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" mb={1}>Schémas de TPE VIH (liste « Schéma prescrit »)</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Libellé</TableCell>
              <TableCell>Molécules</TableCell>
              <TableCell>Remarques</TableCell>
              <TableCell>Ténofovir</TableCell>
              <TableCell>Proposé</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {ref.schemasTpe.map((s, i) => (
              <TableRow key={i}>
                <TableCell><TextField size="small" value={s.code} onChange={(e) => majSchema(i, { code: e.target.value })} sx={{ width: 130 }} /></TableCell>
                <TableCell><TextField size="small" value={s.libelle} onChange={(e) => majSchema(i, { libelle: e.target.value })} /></TableCell>
                <TableCell><TextField size="small" fullWidth value={s.molecules} onChange={(e) => majSchema(i, { molecules: e.target.value })} /></TableCell>
                <TableCell><TextField size="small" value={s.remarques} onChange={(e) => majSchema(i, { remarques: e.target.value })} /></TableCell>
                <TableCell><Checkbox checked={s.contientTenofovir} onChange={(e) => majSchema(i, { contientTenofovir: e.target.checked })} /></TableCell>
                <TableCell><Checkbox checked={s.actif} onChange={(e) => majSchema(i, { actif: e.target.checked })} /></TableCell>
                <TableCell>
                  <IconButton color="error" onClick={() => setRef({ ...ref, schemasTpe: ref.schemasTpe.filter((_, j) => j !== i) })}>
                    <DeleteOutlineIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Stack direction="row" spacing={2} mt={1}>
          <Button
            startIcon={<AddIcon />}
            onClick={() =>
              setRef({ ...ref, schemasTpe: [...ref.schemasTpe, { code: "", libelle: "", molecules: "", remarques: "", contientTenofovir: false, actif: true }] })
            }
          >
            Ajouter un schéma
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={() => enregistrer("schemasTpe", ref.schemasTpe)}>
            Enregistrer
          </Button>
        </Stack>
      </Paper>

      {/* Calendrier (annexe E) */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" mb={1}>Calendrier de suivi et bilans (annexe E)</Typography>
        <Typography variant="body2" color="text.secondary" mb={1}>
          Date de chaque visite = J0 (date de l&apos;AES) + décalage. Les bilans sont pré-cochés quand leur condition est remplie.
        </Typography>
        {ref.calendrier.map((v) => (
          <Box key={v.code} mb={2}>
            <Stack direction="row" spacing={2} alignItems="center" mb={1}>
              <Typography fontWeight={700} sx={{ minWidth: 60 }}>{SUIVI_LIBELLES[v.code]}</Typography>
              <TextField
                type="number"
                size="small"
                label="Décalage (jours)"
                value={v.decalageJours}
                onChange={(e) => majVisite(v.code, { decalageJours: Number(e.target.value) })}
                sx={{ width: 160 }}
              />
            </Stack>
            {v.bilans.map((b, i) => (
              <Stack key={i} direction="row" spacing={1} alignItems="center" mb={0.5}>
                <TextField
                  select
                  size="small"
                  sx={{ width: 160 }}
                  value={b.bilan}
                  onChange={(e) => majVisite(v.code, { bilans: v.bilans.map((x, j) => (j === i ? { ...x, bilan: e.target.value as Bilan } : x)) })}
                >
                  {BILANS.map((x) => <MenuItem key={x} value={x}>{BILAN_LIBELLES[x]}</MenuItem>)}
                </TextField>
                <TextField
                  select
                  size="small"
                  sx={{ minWidth: 420 }}
                  value={b.condition}
                  onChange={(e) =>
                    majVisite(v.code, { bilans: v.bilans.map((x, j) => (j === i ? { ...x, condition: e.target.value as ConditionBilan } : x)) })
                  }
                >
                  {Object.entries(CONDITIONS_BILAN).map(([k, l]) => <MenuItem key={k} value={k}>{l}</MenuItem>)}
                </TextField>
                <IconButton color="error" onClick={() => majVisite(v.code, { bilans: v.bilans.filter((_, j) => j !== i) })}>
                  <DeleteOutlineIcon />
                </IconButton>
              </Stack>
            ))}
            <Button size="small" startIcon={<AddIcon />} onClick={() => majVisite(v.code, { bilans: [...v.bilans, { bilan: "VIH", condition: "TOUS" }] })}>
              Ajouter un bilan
            </Button>
          </Box>
        ))}
        <Button variant="contained" startIcon={<SaveIcon />} onClick={() => enregistrer("calendrier", ref.calendrier)}>
          Enregistrer
        </Button>
      </Paper>

      {/* Textes des annexes */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" mb={1}>Textes d&apos;aide (annexes A à G)</Typography>
        <Typography variant="body2" color="text.secondary" mb={1}>
          Format JSON : pour chaque annexe, un titre, des en-têtes, des lignes et des notes éventuelles.
        </Typography>
        <TextField fullWidth multiline minRows={12} value={annexesJson} onChange={(e) => setAnnexesJson(e.target.value)} sx={{ fontFamily: "monospace" }} />
        <Button
          sx={{ mt: 1 }}
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={() => {
            try {
              enregistrer("annexes", JSON.parse(annexesJson));
            } catch {
              setMessage({ severite: "error", texte: "JSON invalide : vérifiez la syntaxe des annexes." });
            }
          }}
        >
          Enregistrer
        </Button>
      </Paper>
    </Box>
  );
}
