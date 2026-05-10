"use client";

import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, Grid, MenuItem, Paper, Stack, Table,
  TableBody, TableCell, TableHead, TableRow, TextField, Typography,
  Accordion, AccordionSummary, AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dayjs from "dayjs";

const STATUT_SOCIAL_LABELS: Record<string, string> = {
  CELIBATAIRE: "Célibataire",
  MARIE:       "Marié(e)",
  DIVORCE:     "Divorcé(e)",
  VEUF:        "Veuf / Veuve",
};

const VISITE_TYPE_LABELS: Record<string, string> = {
  ANNUELLE:  "Annuelle",
  RAPPROCHEE: "Rapprochée",
  SPONTANEE: "Spontanée",
  EXPERTISE: "Expertise",
  CM:        "Certificat médical",
  ETUDEP:    "Étude de poste",
  AUTRE:     "Autre",
};

const VISITE_STATUT_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon", EN_COURS: "En cours", CLOTUREE: "Clôturée", ANNULEE: "Annulée",
};
const VISITE_STATUT_COLORS: Record<string, "default" | "warning" | "success" | "error"> = {
  BROUILLON: "default", EN_COURS: "warning", CLOTUREE: "success", ANNULEE: "error",
};

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      sx={{
        py: 1,
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:last-child": { borderBottom: "none" },
        gap: 4,
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ minWidth: 200, flexShrink: 0, lineHeight: 1.6 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500} component="div" sx={{ lineHeight: 1.6 }}>
        {value ?? <span style={{ color: "#bbb" }}>—</span>}
      </Typography>
    </Stack>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Typography
      variant="subtitle2"
      color="text.secondary"
      fontWeight={700}
      sx={{ textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5 }}
    >
      {title}
    </Typography>
  );
}

export default function PersonnelViewPage() {
  const params = useParams();
  const id = Array.isArray((params as any).id) ? (params as any).id[0] : (params as any).id;
  const router = useRouter();

  const [p, setP] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Dialog démarrer visite
  const [openStart, setOpenStart] = useState(false);
  const [startAt, setStartAt] = useState("");
  const [typeVisite, setTypeVisite] = useState<string>("ANNUELLE");
  const [autreType, setAutreType] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/personnel/${id}`)
      .then((r) => r.json())
      .then(setP)
      .catch(() => setP(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStartVisit = async () => {
    if (!startAt) { setActionError("Veuillez renseigner la date et l'heure."); return; }
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`/api/personnel/${id}/start-visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateDebut: startAt, type: typeVisite === "AUTRE" ? autreType : typeVisite }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || "Erreur création visite");
      const visiteId = payload?.visiteId;
      if (!visiteId) throw new Error("visiteId manquant");
      setOpenStart(false);
      router.push(`/formulaires/${visiteId}/edit`);
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Box p={4}>Chargement...</Box>;
  if (!p)      return <Box p={4}>Personnel introuvable</Box>;

  const tags: string[]     = Array.isArray(p.tags) ? p.tags : [];
  const pathologies: any[] = Array.isArray(p.pathologies) ? p.pathologies : [];
  const affectations: any[] = Array.isArray(p.affectations) ? p.affectations : [];
  const visites: any[]     = Array.isArray(p.visites) ? p.visites : [];

  return (
    <Box p={4} maxWidth={1100} mx="auto">

      {/* En-tête */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4">Fiche du personnel</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {p.lastName} {p.firstName}
            {p.matricule && ` · ${p.matricule}`}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => router.back()}>Retour</Button>
          <Button variant="outlined" color="warning" onClick={() => router.push(`/personnel/${id}/edit`)}>
            Modifier
          </Button>
          <Button variant="contained" onClick={() => setOpenStart(true)} disabled={!p.isActive}>
            Démarrer une visite
          </Button>
        </Stack>
      </Stack>

      {/* ── Bloc principal ── */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={3}>

        {/* Section 1 : Informations générales */}
        <SectionTitle title="Informations générales" />
        <Grid container spacing={0} columnSpacing={6}>
          <Grid item xs={12} md={6}>
            <InfoRow label="Nom et prénom" value={`${p.lastName} ${p.firstName}`} />
          </Grid>
          <Grid item xs={12} md={6}>
            <InfoRow label="Matricule" value={p.matricule} />
          </Grid>
          <Grid item xs={12} md={6}>
            <InfoRow
              label="Date de naissance"
              value={p.dateNaissance ? dayjs(p.dateNaissance).format("DD/MM/YYYY") : undefined}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <InfoRow
              label="Statut social"
              value={p.statutSocial ? (STATUT_SOCIAL_LABELS[p.statutSocial] ?? p.statutSocial) : undefined}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <InfoRow label="Email" value={p.email} />
          </Grid>
          <Grid item xs={12} md={6}>
            <InfoRow
              label="Statut"
              value={
                <Chip
                  label={p.isActive ? "Actif" : "Inactif"}
                  color={p.isActive ? "success" : "default"}
                  size="small"
                />
              }
            />
          </Grid>
          {!p.isActive && (
            <Grid item xs={12} md={6}>
              <InfoRow
                label="Date de sortie"
                value={p.dateSortie ? dayjs(p.dateSortie).format("DD/MM/YYYY") : undefined}
              />
            </Grid>
          )}
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        {/* Section 2 : Informations professionnelles */}
        <SectionTitle title="Informations professionnelles" />
        <Grid container spacing={0} columnSpacing={6}>
          <Grid item xs={12} md={6}>
            <InfoRow label="Formation" value={p.formation?.libelle} />
          </Grid>
          <Grid item xs={12} md={6}>
            <InfoRow label="Service" value={p.service?.libelle} />
          </Grid>
          <Grid item xs={12} md={6}>
            <InfoRow label="Poste" value={p.poste?.libelle} />
          </Grid>
          {p.posteDetail && (
            <Grid item xs={12} md={6}>
              <InfoRow label="Détail du poste" value={p.posteDetail.libelle} />
            </Grid>
          )}
          <Grid item xs={12} md={6}>
            <InfoRow
              label="Catégorie"
              value={
                <Chip
                  size="small"
                  label={p.categorie === "SMR" ? "SMR" : "VP"}
                  color={p.categorie === "SMR" ? "warning" : "default"}
                />
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <InfoRow
              label="Date d'affectation CHU"
              value={p.dateAffectation ? dayjs(p.dateAffectation).format("DD/MM/YYYY") : undefined}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <InfoRow
              label="Date prochaine visite"
              value={p.dateProchainVisite ? dayjs(p.dateProchainVisite).format("DD/MM/YYYY") : undefined}
            />
          </Grid>
          {tags.length > 0 && (
            <Grid item xs={12}>
              <InfoRow
                label="Tags"
                value={
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {tags.map((t) => <Chip key={t} size="small" label={t} />)}
                  </Stack>
                }
              />
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* ── Historique des pathologies ── */}
      <Accordion defaultExpanded={pathologies.length > 0} sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Historique des pathologies
            {pathologies.length > 0 && (
              <Chip size="small" label={pathologies.length} sx={{ ml: 1 }} color="info" />
            )}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "background.default" }}>
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
                    <Typography variant="body2" color="text.secondary" p={1}>Aucune pathologie enregistrée.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                pathologies.map((x: any, i: number) => (
                  <TableRow key={x.id ?? i} hover>
                    <TableCell>{x.cim11?.code ? `${x.cim11.code} — ${x.cim11.libelle}` : "—"}</TableCell>
                    <TableCell>{x.date ? dayjs(x.date).format("DD/MM/YYYY") : "—"}</TableCell>
                    <TableCell>{x.commentaire || "—"}</TableCell>
                    <TableCell>{x.source || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AccordionDetails>
      </Accordion>

      {/* ── Historique des affectations ── */}
      <Accordion defaultExpanded={false} sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Historique des affectations</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "background.default" }}>
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
                    <Typography variant="body2" color="text.secondary" p={1}>Aucune affectation enregistrée.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                affectations.map((a: any, i: number) => (
                  <TableRow key={a.id ?? i} hover>
                    <TableCell>{a.formation?.libelle ?? "—"}</TableCell>
                    <TableCell>{a.service?.libelle ?? "—"}</TableCell>
                    <TableCell>{a.dateAffectation ? dayjs(a.dateAffectation).format("DD/MM/YYYY") : "—"}</TableCell>
                    <TableCell>{a.note || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AccordionDetails>
      </Accordion>

      {/* ── Historique des visites ── */}
      <Accordion defaultExpanded={visites.length > 0} sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Historique des visites
            {visites.length > 0 && (
              <Chip size="small" label={visites.length} sx={{ ml: 1 }} color="info" />
            )}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "background.default" }}>
                <TableCell>Type</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Date début</TableCell>
                <TableCell>Date fin</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2" color="text.secondary" p={1}>Aucune visite enregistrée.</Typography>
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
                      <Button size="small" variant="outlined" onClick={() => router.push(`/visites/${v.id}`)}>
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AccordionDetails>
      </Accordion>

      {/* ── Dialog Démarrer une visite ── */}
      <Dialog open={openStart} onClose={() => !actionLoading && setOpenStart(false)} fullWidth maxWidth="sm">
        <DialogTitle>Démarrer une visite</DialogTitle>
        <DialogContent>
          <Box mt={1} display="flex" flexDirection="column" gap={2}>
            {actionError && <Alert severity="error">{actionError}</Alert>}
            <TextField
              fullWidth type="datetime-local" label="Date et heure de début"
              InputLabelProps={{ shrink: true }}
              value={startAt} onChange={(e) => setStartAt(e.target.value)}
            />
            <TextField
              select fullWidth label="Type de visite"
              value={typeVisite} onChange={(e) => setTypeVisite(e.target.value)}
            >
              {Object.entries(VISITE_TYPE_LABELS).map(([v, l]) => (
                <MenuItem key={v} value={v}>{l}</MenuItem>
              ))}
            </TextField>
            {typeVisite === "AUTRE" && (
              <TextField fullWidth label="Préciser" value={autreType} onChange={(e) => setAutreType(e.target.value)} />
            )}
            <Typography variant="body2" color="text.secondary">
              Une visite et son formulaire seront créés pour ce personnel.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button disabled={actionLoading} onClick={() => setOpenStart(false)}>Annuler</Button>
          <Button variant="contained" disabled={actionLoading} onClick={handleStartVisit}>
            {actionLoading ? "Création..." : "Démarrer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
