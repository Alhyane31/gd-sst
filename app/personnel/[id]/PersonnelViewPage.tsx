"use client";

import {
  Box, Paper, Typography, Grid, Chip, Button, Accordion,
  AccordionSummary, AccordionDetails, Table, TableHead,
  TableRow, TableCell, TableBody,Dialog,DialogActions,MenuItem,TextField,DialogContent,Alert,DialogTitle
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dayjs from "dayjs";
 

export default function PersonnelViewPage() {

// Dialog state
  const [openStart, setOpenStart] = useState(false);
  const [startAt, setStartAt] = useState<string>(""); // yyyy-mm-ddTHH:mm
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string>("");

const [typeVisite, setTypeVisite] = useState<"ANNUELLE"|"RAPPROCHEE" | "CM" |"EXPERTISE" | "ETUDEP" | "SPONTANEE" |  "AUTRE">("ANNUELLE");
const [autreType, setAutreType] = useState("");

  const formatDateTime = (value?: string | Date | null) => {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "-";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };
function labelCategorie(c?: string) {
  return c === "SMR" ? "SMR" : "VP";
}

const VISITE_TYPE_LABELS: Record<string, string> = {
  ANNUELLE: "Annuelle",
  RAPPROCHEE: "Rapprochée",
  SPONTANEE: "Spontanée",
  EXPERTISE: "Expertise",
  CM: "Certificat médical",
  ETUDEP: "Étude de poste",
  AUTRE: "Autre",
};
const VISITE_STATUT_COLORS: Record<string, "default" | "warning" | "success" | "error"> = {
  BROUILLON: "default", EN_COURS: "warning", CLOTUREE: "success", ANNULEE: "error",
};
const VISITE_STATUT_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon", EN_COURS: "En cours", CLOTUREE: "Clôturée", ANNULEE: "Annulée",
};
const handleStartVisit = async () => {
  if (!startAt) {
    setActionError("Veuillez renseigner la date et l’heure.");
    return;
  }

  setActionLoading(true);
  setActionError("");

  try {
    const res = await fetch(`/api/personnel/${id}/start-visit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateDebut: startAt,
        type: typeVisite === "AUTRE" ? autreType : typeVisite,
      }),
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(payload?.message || "Erreur création visite");
    }

    const visiteId = payload?.visiteId;
    if (!visiteId) throw new Error("visiteId manquant");

    setOpenStart(false);

    // refresh personnel
    const ref = await fetch(`/api/personnel/${id}`);
    if (ref.ok) setP(await ref.json());

    // ✅ redirection vers formulaire
    router.push(`/formulaires/${visiteId}/edit`);

  } catch (e: any) {
    setActionError(e.message);
  } finally {
    setActionLoading(false);
  }
};

  const params = useParams();
  const id = Array.isArray((params as any).id) ? (params as any).id[0] : (params as any).id;
  const router = useRouter();

  const [p, setP]           = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/personnel/${id}`)
      .then((r) => r.json())
      .then(setP)
      .catch(() => setP(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box p={4}>Chargement...</Box>;
  if (!p)      return <Box p={4}>Personnel introuvable</Box>;

  const tags: string[]        = Array.isArray(p.tags) ? p.tags : [];
  const pathologies: any[]    = Array.isArray(p.pathologies) ? p.pathologies : [];
  const affectations: any[]   = Array.isArray(p.affectations) ? p.affectations : [];
  const visites: any[]        = Array.isArray(p.visites) ? p.visites : [];

  return (
    <Box p={4}>
  <Box
    display="flex"
    justifyContent="space-between"
    alignItems="center"
    mb={3}
  >
    <Typography variant="h4">
      Fiche du personnel
    </Typography>

    {/* ✅ Groupe de boutons */}
    <Box display="flex" gap={2}>
      <Button
        variant="outlined"
        onClick={() => router.back()}
      >
        Retour
      </Button>

      <Button
        variant="contained"
        onClick={() => setOpenStart(true)}
      >
        Démarrer une visite
      </Button>
    </Box>
  </Box>

      {/* ── Infos générales ─────────────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography><b>Nom :</b> {p.firstName} {p.lastName}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <b>Statut :</b>
              <Chip label={p.isActive ? "Actif" : "Inactif"} color={p.isActive ? "success" : "default"} size="small" />
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography><b>Matricule :</b> {p.matricule ?? "—"}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography><b>Poste :</b> {p.poste?.libelle ?? "—"}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography><b>Formation :</b> {p.formation?.libelle ?? "—"}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography><b>Service :</b> {p.service?.libelle ?? "—"}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <b>Catégorie :</b>
              <Chip size="small" label={labelCategorie(p.categorie)} color={p.categorie === "SMR" ? "warning" : "default"} />
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography>
              <b>Prochaine visite :</b>{" "}
              {p.dateProchainVisite ? dayjs(p.dateProchainVisite).format("DD/MM/YYYY") : "—"}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <b>Tags :</b>
              {tags.length === 0
                ? <Chip size="small" label="Aucun" variant="outlined" />
                : tags.map((t) => <Chip key={t} size="small" label={t} sx={{ mr: 0.5 }} />)}
            </Typography>
          </Grid>
          <Grid item xs={12} mt={1}>
            <Button variant="contained" onClick={() => router.push(`/personnel/${id}/edit`)}>
              Modifier
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ── Historique des pathologies ───────────────────────────────────── */}
      <Accordion defaultExpanded={false} sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Historique des pathologies</Typography>
        </AccordionSummary>
        <AccordionDetails>
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
                {pathologies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography variant="body2" color="text.secondary">Aucune pathologie enregistrée.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pathologies.map((x: any, i: number) => (
                    <TableRow key={x.id ?? i}>
                      <TableCell>{x.cim11?.code ? `${x.cim11.code} — ${x.cim11.libelle}` : "—"}</TableCell>
                      <TableCell>{x.date ? dayjs(x.date).format("DD/MM/YYYY") : "—"}</TableCell>
                      <TableCell>{x.commentaire || "—"}</TableCell>
                      <TableCell>{x.source || "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </AccordionDetails>
      </Accordion>

      {/* ── Historique des affectations ──────────────────────────────────── */}
      <Accordion defaultExpanded={false} sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Historique des affectations</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Paper variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Formation</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Date d'affectation</TableCell>
                  <TableCell>Note</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {affectations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography variant="body2" color="text.secondary">Aucune affectation enregistrée.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  affectations.map((a: any, i: number) => (
                    <TableRow key={a.id ?? i}>
                      <TableCell>{a.formation?.libelle ?? "—"}</TableCell>
                      <TableCell>{a.service?.libelle ?? "—"}</TableCell>
                      <TableCell>{a.dateAffectation ? dayjs(a.dateAffectation).format("DD/MM/YYYY") : "—"}</TableCell>
                      <TableCell>{a.note || "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </AccordionDetails>
      </Accordion>

      {/* ── Historique des visites ───────────────────────────────────────── */}
      <Accordion defaultExpanded={false} sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Historique des visites</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Paper variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Date début</TableCell>
                  <TableCell>Date fin</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visites.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography variant="body2" color="text.secondary">Aucune visite enregistrée.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  visites.map((v: any, i: number) => (
                    <TableRow key={v.id ?? i} hover>
                      <TableCell>
                        <Chip size="small" variant="outlined"
                          label={v.type === "AUTRE" && v.typeAutre ? `Autre — ${v.typeAutre}` : (VISITE_TYPE_LABELS[v.type] ?? v.type)} />
                      </TableCell>
                      <TableCell>
                        <Chip size="small"
                          label={VISITE_STATUT_LABELS[v.statut] ?? v.statut}
                          color={VISITE_STATUT_COLORS[v.statut] ?? "default"} />
                      </TableCell>
                      <TableCell>{v.dateDebut ? dayjs(v.dateDebut).format("DD/MM/YYYY") : "—"}</TableCell>
                      <TableCell>{v.dateFin   ? dayjs(v.dateFin).format("DD/MM/YYYY")   : "—"}</TableCell>
                      <TableCell align="center">
                        <Button size="small" variant="outlined"
                          onClick={() => router.push(`/visites/${v.id}`)}>
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </AccordionDetails>
      </Accordion>
      <Dialog
  open={openStart}
  onClose={() => (actionLoading ? null : setOpenStart(false))}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>Démarrer une visite</DialogTitle>

  <DialogContent>
    <Box mt={1}>
      {actionError && (
        <Box mb={2}>
          <Alert severity="error">{actionError}</Alert>
        </Box>
      )}

      <TextField
        fullWidth
        type="datetime-local"
        label="Date et heure de début"
        InputLabelProps={{ shrink: true }}
        value={startAt}
        onChange={(e) => setStartAt(e.target.value)}
      />

          <TextField
            select
            fullWidth
            label="Type de visite"
            value={typeVisite}
            onChange={(e) => setTypeVisite(e.target.value as any)}
            sx={{ mt: 2 }}
          >
            {Object.entries(VISITE_TYPE_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>

      {typeVisite === "AUTRE" && (
        <TextField
          fullWidth
          label="Préciser"
          value={autreType}
          onChange={(e) => setAutreType(e.target.value)}
          sx={{ mt: 2 }}
        />
      )}

      <Typography variant="body2" color="text.secondary" mt={1}>
        Une visite et son formulaire seront créés pour ce personnel.
      </Typography>
    </Box>
  </DialogContent>

  <DialogActions>
    <Button disabled={actionLoading} onClick={() => setOpenStart(false)}>
      Annuler
    </Button>

    <Button
      variant="contained"
      disabled={actionLoading}
      onClick={handleStartVisit}
    >
      {actionLoading ? "Création..." : "Démarrer"}
    </Button>
  </DialogActions>
</Dialog>
    </Box>
  );
}