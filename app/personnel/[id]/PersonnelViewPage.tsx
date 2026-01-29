"use client";

import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  TextField,
  MenuItem,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Cim11Record = {
  id: string;
  cimCode: string;
  libelle: string;
  dateDebut?: string;
  statut: "Actif" | "Résolu" | "En rémission" | "Inconnu";
  commentaire?: string;
};

const CIM11_OPTIONS = [
  { code: "BA00", libelle: "Diabète sucré de type 2" },
  { code: "CA40", libelle: "Hypertension essentielle (primaire)" },
  { code: "MG30", libelle: "Asthme" },
  { code: "1A00", libelle: "COVID-19 (infection confirmée)" },
  { code: "6B40", libelle: "Trouble anxieux généralisé" },
];

function labelCategorie(c?: string) {
  if (c === "SMR") return "SMR";
  return "VP";
}

export default function PersonnelViewPage() {
  const params = useParams();
  const id = Array.isArray((params as any).id) ? (params as any).id[0] : (params as any).id;

  const router = useRouter();
  const [p, setP] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ====== Antécédents médicaux (state local front only)
  const [antecedents, setAntecedents] = useState<Cim11Record[]>([]);
  const [newAnt, setNewAnt] = useState<Omit<Cim11Record, "id">>({
    cimCode: "",
    libelle: "",
    dateDebut: "",
    statut: "Actif",
    commentaire: "",
  });

  const cimOptionsMap = useMemo(() => {
    const m = new Map<string, string>();
    CIM11_OPTIONS.forEach((x) => m.set(x.code, x.libelle));
    return m;
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`/api/personnel/${id}`);
        if (!res.ok) throw new Error("Erreur chargement");
        setP(await res.json());
      } catch {
        setP(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) run();
  }, [id]);

  const addAntecedent = () => {
    if (!newAnt.cimCode || !newAnt.libelle) return;

    const record: Cim11Record = {
      id: crypto.randomUUID(),
      ...newAnt,
    };

    setAntecedents((prev) => [record, ...prev]);

    setNewAnt({
      cimCode: "",
      libelle: "",
      dateDebut: "",
      statut: "Actif",
      commentaire: "",
    });
  };

  const removeAntecedent = (rid: string) => {
    setAntecedents((prev) => prev.filter((x) => x.id !== rid));
  };

  if (loading) return <Box p={4}>Chargement...</Box>;
  if (!p) return <Box p={4}>Personnel introuvable</Box>;

  const tags: string[] = Array.isArray(p.tags) ? p.tags : [];

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Fiche du personnel</Typography>
        <Button variant="outlined" onClick={() => router.back()}>
          Retour
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }} elevation={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography>
              <b>Nom :</b> {p.firstName} {p.lastName}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <b>Statut :</b>
              <Chip
                label={p.isActive ? "Actif" : "Inactif"}
                color={p.isActive ? "success" : "default"}
                size="small"
              />
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography>
              <b>Poste :</b> {p.poste?.libelle}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography>
              <b>Formation :</b> {p.formation?.libelle}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography>
              <b>Service :</b> {p.service?.libelle}
            </Typography>
          </Grid>

          {/* ✅ Catégorie */}
          <Grid item xs={12} md={6}>
            <Typography sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <b>Catégorie :</b>
              <Chip
                size="small"
                label={labelCategorie(p.categorie)}
                color={p.categorie === "SMR" ? "warning" : "default"}
              />
            </Typography>
          </Grid>

          {/* ✅ Tags */}
          <Grid item xs={12}>
            <Typography sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <b>Tags :</b>
              {tags.length === 0 ? (
                <Chip size="small" label="Aucun" variant="outlined" />
              ) : (
                tags.map((t) => <Chip key={t} size="small" label={t} sx={{ mr: 0.5, mb: 0.5 }} />)
              )}
            </Typography>
          </Grid>

          <Grid item xs={12} mt={2}>
            <Button variant="contained" onClick={() => router.push(`/personnel/${id}/edit`)}>
              Modifier
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ====== Section rétractable : antécédents CIM-11 ====== */}
      <Accordion defaultExpanded={false}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Antécédents médicaux (CIM-11)</Typography>
        </AccordionSummary>

        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Saisie provisoire (front uniquement). Plus tard, on branchera ça sur la base + historique complet.
          </Typography>

          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" mb={1}>
              Ajouter un antécédent
            </Typography>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Code CIM-11"
                  value={newAnt.cimCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setNewAnt((prev) => ({
                      ...prev,
                      cimCode: code,
                      libelle: cimOptionsMap.get(code) ?? prev.libelle,
                    }));
                  }}
                >
                  <MenuItem value="">Sélectionner</MenuItem>
                  {CIM11_OPTIONS.map((x) => (
                    <MenuItem key={x.code} value={x.code}>
                      {x.code} — {x.libelle}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Libellé"
                  value={newAnt.libelle}
                  onChange={(e) => setNewAnt((prev) => ({ ...prev, libelle: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Date début"
                  InputLabelProps={{ shrink: true }}
                  value={newAnt.dateDebut || ""}
                  onChange={(e) => setNewAnt((prev) => ({ ...prev, dateDebut: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Statut"
                  value={newAnt.statut}
                  onChange={(e) =>
                    setNewAnt((prev) => ({ ...prev, statut: e.target.value as Cim11Record["statut"] }))
                  }
                >
                  {["Actif", "Résolu", "En rémission", "Inconnu"].map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={1} display="flex" justifyContent="flex-end">
                <IconButton color="primary" onClick={addAntecedent} aria-label="Ajouter">
                  <AddIcon />
                </IconButton>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Commentaire"
                  value={newAnt.commentaire || ""}
                  onChange={(e) => setNewAnt((prev) => ({ ...prev, commentaire: e.target.value }))}
                />
              </Grid>
            </Grid>
          </Paper>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" mb={1}>
            Historique
          </Typography>

          {antecedents.length === 0 ? (
            <Typography color="text.secondary">Aucun antécédent saisi.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Libellé</TableCell>
                  <TableCell>Date début</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Commentaire</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {antecedents.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.cimCode}</TableCell>
                    <TableCell>{a.libelle}</TableCell>
                    <TableCell>{a.dateDebut || "-"}</TableCell>
                    <TableCell>
                      <Chip size="small" label={a.statut} />
                    </TableCell>
                    <TableCell>{a.commentaire || "-"}</TableCell>
                    <TableCell align="center">
                      <IconButton color="error" onClick={() => removeAntecedent(a.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
