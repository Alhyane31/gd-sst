"use client";

import {
  Box, Paper, Typography, Chip, Button, Divider, Stack, Grid,
  CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, IconButton, TextField, Tooltip,
} from "@mui/material";
import dayjs from "dayjs";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AddIcon from "@mui/icons-material/Add";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EventIcon from "@mui/icons-material/Event";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import WorkIcon from "@mui/icons-material/Work";
import DeleteIcon from "@mui/icons-material/Delete";
import RateReviewIcon from "@mui/icons-material/RateReview";

// ─── Types ───────────────────────────────────────────────────────────────────

type VisiteType    = "ANNUELLE" | "RAPPROCHEE" | "SPONTANNE" | "EXPERTISE" | "AUTRE";
type VisiteStatut  = "BROUILLON" | "EN_COURS" | "CLOTUREE" | "ANNULEE";
type ConvStatut    = "A_CONVOQUER" | "CONVOCATION_GENEREE" | "A_TRAITER" | "A_RELANCER" | "RELANCEE" | "REALISEE" | "ANNULEE";
type FormStatut    = "DRAFT" | "SUBMITTED" | "VERIFIED";

interface VisiteDetail {
  id: string;
  type: VisiteType;
  typeAutre?: string | null;
  statut: VisiteStatut;
  dateDebut: string;
  dateFin?: string | null;
  personnel: {
    id: string; firstName: string; lastName: string;
    matricule?: string | null;
    poste: { libelle: string };
    service: { libelle: string };
    formation: { libelle: string };
  };
  convocation?: {
    id: string;
    datePrevue: string;
    dateRealisee?: string | null;
    statut: ConvStatut;
    convocationType: string;
    commentaire?: string | null;
    bordereau?: { id: string; serialNumber: string } | null;
  } | null;
  formulaire?: {
    id: string;
    statut: FormStatut;
    createdAt: string;
    submittedAt?: string | null;
    verifiedAt?: string | null;
    filledBy?: { firstName: string; lastName: string } | null;
    submittedBy?: { firstName: string; lastName: string } | null;
  } | null;
  etudeDePoste?: { id: string; createdAt: string } | null;
  createdBy: { firstName: string; lastName: string };
  updatedBy?: { firstName: string; lastName: string } | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Labels / couleurs ───────────────────────────────────────────────────────

const TYPE_LABELS: Record<VisiteType, string> = {
  ANNUELLE: "Annuelle", RAPPROCHEE: "Rapprochée", SPONTANNE: "Spontanée",
  EXPERTISE: "Expertise", AUTRE: "Autre",
};

const STATUT_LABELS: Record<VisiteStatut, string> = {
  BROUILLON: "Brouillon", EN_COURS: "En cours", CLOTUREE: "Clôturée", ANNULEE: "Annulée",
};
const STATUT_COLORS: Record<VisiteStatut, "default" | "warning" | "success" | "error"> = {
  BROUILLON: "default", EN_COURS: "warning", CLOTUREE: "success", ANNULEE: "error",
};

const CONV_LABELS: Record<ConvStatut, string> = {
  A_CONVOQUER: "À convoquer", CONVOCATION_GENEREE: "Convocation générée",
  A_TRAITER: "À traiter", A_RELANCER: "À relancer",
  RELANCEE: "Relancée", REALISEE: "Réalisée", ANNULEE: "Annulée",
};

const FORM_LABELS: Record<FormStatut, string> = {
  DRAFT: "Brouillon", SUBMITTED: "Soumis", VERIFIED: "Vérifié",
};
const FORM_COLORS: Record<FormStatut, "default" | "warning" | "success"> = {
  DRAFT: "default", SUBMITTED: "warning", VERIFIED: "success",
};

// ─── Sous-composant : ligne d'info ───────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1} alignItems="flex-start" py={0.5}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 180 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>{value ?? "—"}</Typography>
    </Stack>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
      {icon}
      <Typography variant="h6">{title}</Typography>
    </Stack>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function VisiteConsultationPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [visite, setVisite]       = useState<VisiteDetail | null>(null);
  const [loading, setLoading]     = useState(true);
  const [confirmClose, setConfirmClose] = useState(false);
  const [closing, setClosing]     = useState(false);

  // Avis spécialisés
  type Avis = { id: string; nomPrenom: string; dateAvis: string; contenu: string; rapportUrl?: string | null };
  const [avisList, setAvisList]   = useState<Avis[]>([]);
  const [avisDialog, setAvisDialog] = useState(false);
  const [editingAvis, setEditingAvis] = useState<Avis | null>(null);
  const [avisForm, setAvisForm]   = useState({ nomPrenom: "", dateAvis: "", contenu: "", rapportUrl: "" });
  const [avisSaving, setAvisSaving] = useState(false);
  const [avisUploading, setAvisUploading] = useState(false);
  const [avisBlobUrl, setAvisBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/visites/${id}`)
      .then((r) => r.json())
      .then(setVisite)
      .finally(() => setLoading(false));
    fetch(`/api/visites/${id}/avis-specialises`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setAvisList(data));
  }, [id]);

  const openAvisDialog = (a?: Avis) => {
    setEditingAvis(a ?? null);
    setAvisBlobUrl(null);
    setAvisForm(a
      ? { nomPrenom: a.nomPrenom, dateAvis: a.dateAvis.substring(0, 10), contenu: a.contenu, rapportUrl: a.rapportUrl ?? "" }
      : { nomPrenom: "", dateAvis: "", contenu: "", rapportUrl: "" });
    setAvisDialog(true);
  };

  const handleAvisFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blob = URL.createObjectURL(file);
    setAvisBlobUrl(blob);
    setAvisUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        setAvisForm((f) => ({ ...f, rapportUrl: url }));
      }
    } finally {
      setAvisUploading(false);
    }
  };

  const saveAvis = async () => {
    setAvisSaving(true);
    try {
      const url = editingAvis
        ? `/api/visites/${id}/avis-specialises/${editingAvis.id}`
        : `/api/visites/${id}/avis-specialises`;
      const res = await fetch(url, {
        method: editingAvis ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...avisForm, rapportUrl: avisForm.rapportUrl || null }),
      });
      if (!res.ok) return;
      const saved: Avis = await res.json();
      setAvisList((prev) =>
        editingAvis ? prev.map((a) => a.id === saved.id ? saved : a) : [saved, ...prev]
      );
      setAvisDialog(false);
    } finally {
      setAvisSaving(false);
    }
  };

  const deleteAvis = async (avisId: string) => {
    await fetch(`/api/visites/${id}/avis-specialises/${avisId}`, { method: "DELETE" });
    setAvisList((prev) => prev.filter((a) => a.id !== avisId));
  };

  const handleCloturer = async () => {
    setClosing(true);
    try {
      const res = await fetch(`/api/visites/${id}/cloturer`, { method: "PATCH" });
      if (res.ok) {
        setVisite((prev) => prev ? { ...prev, statut: "CLOTUREE" } : prev);
      }
    } finally {
      setClosing(false);
      setConfirmClose(false);
    }
  };

  const handleCreerFormulaire = async () => {
    const res = await fetch(`/api/visites/${id}/formulaire`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      router.push(`/formulaires/${data.id}`);
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!visite) {
    return (
      <Box p={4}>
        <Typography color="error">Visite introuvable.</Typography>
      </Box>
    );
  }

  const peutCloturer = visite.statut === "EN_COURS" || visite.statut === "BROUILLON";

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Box p={4} maxWidth={1200} mx="auto">

      {/* En-tête */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4">
            Visite — {visite.personnel.lastName} {visite.personnel.firstName}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Créée le {dayjs(visite.createdAt).format("DD/MM/YYYY")} par {visite.createdBy.firstName} {visite.createdBy.lastName}
            {visite.updatedBy && ` · Modifiée par ${visite.updatedBy.firstName} ${visite.updatedBy.lastName}`}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Chip
            label={STATUT_LABELS[visite.statut]}
            color={STATUT_COLORS[visite.statut]}
            size="medium"
          />
          {visite.statut !== "CLOTUREE" && visite.statut !== "ANNULEE" && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<EditIcon />}
              onClick={() => router.push(`/visites/${id}/edit`)}
            >
              Modifier
            </Button>
          )}
          {peutCloturer && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleOutlineIcon />}
              onClick={() => setConfirmClose(true)}
            >
              Clôturer
            </Button>
          )}
        </Stack>
      </Stack>

      <Stack spacing={3}>

        {/* ── Bloc 1 : Rappel de la visite ───────────────────────────────── */}
        <Paper sx={{ p: 3 }} elevation={3}>
          <SectionTitle
            icon={<MedicalServicesIcon color="primary" />}
            title="Rappel de la visite"
          />
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2} sx={{ width: "100%" }}>
            <Grid item xs={6}>
              <InfoRow label="Personnel"
                value={`${visite.personnel.lastName} ${visite.personnel.firstName}`} />
              <InfoRow label="Matricule" value={visite.personnel.matricule} />
              <InfoRow label="Poste" value={visite.personnel.poste.libelle} />
              <InfoRow label="Service" value={visite.personnel.service.libelle} />
              <InfoRow label="Formation" value={visite.personnel.formation.libelle} />
            </Grid>
            <Grid item xs={6} >
              <InfoRow label="Type de visite"
                value={visite.type === "AUTRE" && visite.typeAutre
                  ? `Autre — ${visite.typeAutre}`
                  : TYPE_LABELS[visite.type]} />
              <InfoRow label="Statut"
                value={<Chip size="small" label={STATUT_LABELS[visite.statut]} color={STATUT_COLORS[visite.statut]} />} />
              <InfoRow label="Date de début" value={dayjs(visite.dateDebut).format("DD/MM/YYYY HH:mm")} />
              <InfoRow label="Date de fin"
                value={visite.dateFin ? dayjs(visite.dateFin).format("DD/MM/YYYY HH:mm") : "—"} />
            </Grid>
          </Grid>
        </Paper>

        {/* ── Bloc 2 : Convocation (conditionnel) ────────────────────────── */}
        {visite.convocation ? (
          <Paper sx={{ p: 3 }} elevation={3}>
            <SectionTitle
              icon={<EventIcon color="primary" />}
              title="Convocation liée"
            />
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2} sx={{ width: "100%" }}>
              <Grid item xs={12} md={6}>
                <InfoRow label="Date prévue"
                  value={dayjs(visite.convocation.datePrevue).format("DD/MM/YYYY")} />
                <InfoRow label="Date réalisée"
                  value={visite.convocation.dateRealisee
                    ? dayjs(visite.convocation.dateRealisee).format("DD/MM/YYYY")
                    : "—"} />
                <InfoRow label="Statut"
                  value={<Chip size="small" label={CONV_LABELS[visite.convocation.statut]} variant="outlined" />} />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoRow label="Type" value={visite.convocation.convocationType} />
                <InfoRow label="Bordereau"
                  value={visite.convocation.bordereau
                    ? `N° ${visite.convocation.bordereau.serialNumber}`
                    : "—"} />
                <InfoRow label="Commentaire" value={visite.convocation.commentaire} />
              </Grid>
            </Grid>
          </Paper>
        ) : null}

        {/* ── Bloc 3 : Formulaire ─────────────────────────────────────────── */}
        <Paper sx={{ p: 3 }} elevation={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <SectionTitle
              icon={<AssignmentIcon color="primary" />}
              title="Formulaire de visite"
            />
            {!visite.formulaire && visite.statut !== "CLOTUREE" && visite.statut !== "ANNULEE" && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreerFormulaire}
              >
                Créer le formulaire
              </Button>
            )}
            {visite.formulaire && (
              <Button
                variant="outlined"
                startIcon={<AssignmentIcon />}
                onClick={() => router.push(`/formulaires/${visite.id}/edit`)}
              >
                Ouvrir le formulaire
              </Button>
            )}
          </Stack>
          <Divider sx={{ mb: 2 }} />

          {visite.formulaire ? (
            <Grid container spacing={2} sx={{ width: "100%" }}>
              <Grid item xs={12} md={6}>
                <InfoRow label="Statut"
                  value={
                    <Chip
                      size="small"
                      label={FORM_LABELS[visite.formulaire.statut]}
                      color={FORM_COLORS[visite.formulaire.statut]}
                    />
                  } />
                <InfoRow label="Créé le"
                  value={dayjs(visite.formulaire.createdAt).format("DD/MM/YYYY")} />
                <InfoRow label="Rempli par"
                  value={visite.formulaire.filledBy
                    ? `${visite.formulaire.filledBy.firstName} ${visite.formulaire.filledBy.lastName}`
                    : "—"} />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoRow label="Soumis le"
                  value={visite.formulaire.submittedAt
                    ? dayjs(visite.formulaire.submittedAt).format("DD/MM/YYYY")
                    : "—"} />
                <InfoRow label="Soumis par"
                  value={visite.formulaire.submittedBy
                    ? `${visite.formulaire.submittedBy.firstName} ${visite.formulaire.submittedBy.lastName}`
                    : "—"} />
                <InfoRow label="Vérifié le"
                  value={visite.formulaire.verifiedAt
                    ? dayjs(visite.formulaire.verifiedAt).format("DD/MM/YYYY")
                    : "—"} />
              </Grid>
            </Grid>
          ) : (
            <Box
              sx={{
                py: 4, textAlign: "center",
                border: "1px dashed", borderColor: "divider",
                borderRadius: 2, color: "text.secondary",
              }}
            >
              <AssignmentIcon sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
              <Typography variant="body2">
                Aucun formulaire n'est encore lié à cette visite.
              </Typography>
              <Typography variant="caption">
                Cliquez sur "Créer le formulaire" pour démarrer la saisie.
              </Typography>
            </Box>
          )}

          {/* Étude de poste */}
          {visite.formulaire && (
            <Box mt={3}>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <WorkIcon color="action" fontSize="small" />
                  <Typography variant="body2" fontWeight={500}>Étude de poste</Typography>
                  {visite.etudeDePoste && (
                    <Typography variant="caption" color="text.secondary">
                      — créée le {dayjs(visite.etudeDePoste.createdAt).format("DD/MM/YYYY")}
                    </Typography>
                  )}
                </Stack>
                {visite.etudeDePoste ? (
                  <Button
                    size="small" variant="outlined" startIcon={<WorkIcon />}
                    onClick={() => router.push(`/etude-de-poste/${id}`)}
                  >
                    Ouvrir l'étude de poste
                  </Button>
                ) : visite.statut !== "CLOTUREE" && visite.statut !== "ANNULEE" ? (
                  <Button
                    size="small" variant="contained" startIcon={<AddIcon />}
                    onClick={async () => {
                      const res = await fetch(`/api/visites/${id}/etude-de-poste`, { method: "POST" });
                      if (res.ok) {
                        setVisite((prev) => prev
                          ? { ...prev, etudeDePoste: { id: "", createdAt: new Date().toISOString() } }
                          : prev);
                        router.push(`/etude-de-poste/${id}`);
                      }
                    }}
                  >
                    Ajouter une étude de poste
                  </Button>
                ) : null}
              </Stack>
            </Box>
          )}
        </Paper>

        {/* ── Bloc Avis spécialisés ─────────────────────────────────────────── */}
        <Paper sx={{ p: 3 }} elevation={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <SectionTitle icon={<RateReviewIcon color="primary" />} title="Avis spécialisés" />
            {visite.statut !== "CLOTUREE" && visite.statut !== "ANNULEE" && (
              <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => openAvisDialog()}>
                Ajouter un avis
              </Button>
            )}
          </Stack>
          <Divider sx={{ mb: 2 }} />

          {avisList.length === 0 ? (
            <Box sx={{ py: 3, textAlign: "center", border: "1px dashed", borderColor: "divider", borderRadius: 2 }}>
              <RateReviewIcon sx={{ fontSize: 36, opacity: 0.3, mb: 1 }} />
              <Typography variant="body2" color="text.secondary">Aucun avis spécialisé enregistré.</Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {avisList.map((a) => (
                <Paper key={a.id} variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>{a.nomPrenom}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(a.dateAvis).format("DD/MM/YYYY")}
                      </Typography>
                      <Typography variant="body2" mt={1} sx={{ whiteSpace: "pre-wrap" }}>{a.contenu}</Typography>
                      {a.rapportUrl && (
                        <Button size="small" variant="text" sx={{ mt: 0.5, p: 0 }}
                          onClick={() => window.open(a.rapportUrl!, "_blank")}
                        >
                          📄 Voir le rapport joint
                        </Button>
                      )}
                    </Box>
                    {visite.statut !== "CLOTUREE" && visite.statut !== "ANNULEE" && (
                      <Stack direction="row" spacing={0.5} flexShrink={0} ml={2}>
                        <Tooltip title="Modifier">
                          <IconButton size="small" onClick={() => openAvisDialog(a)}><EditIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton size="small" color="error" onClick={() => deleteAvis(a.id)}><DeleteIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      </Stack>

      {/* ── Dialog avis spécialisé ────────────────────────────────────────── */}
      <Dialog open={avisDialog} onClose={() => setAvisDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAvis ? "Modifier l'avis spécialisé" : "Ajouter un avis spécialisé"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Nom et prénom du Professeur référent *"
              fullWidth size="small"
              value={avisForm.nomPrenom}
              onChange={(e) => setAvisForm((f) => ({ ...f, nomPrenom: e.target.value }))}
            />
            <TextField
              label="Date de l'avis spécialisé *"
              type="date" size="small"
              value={avisForm.dateAvis}
              onChange={(e) => setAvisForm((f) => ({ ...f, dateAvis: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Contenu de l'avis médical *"
              fullWidth multiline minRows={4} size="small"
              value={avisForm.contenu}
              onChange={(e) => setAvisForm((f) => ({ ...f, contenu: e.target.value }))}
            />
            <Box>
              <Typography variant="body2" mb={0.5}>Rapport joint (optionnel)</Typography>
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <Button
                  variant="outlined" component="label" size="small"
                  startIcon={avisUploading ? <CircularProgress size={14} /> : undefined}
                  disabled={avisUploading}
                >
                  {avisUploading ? "Envoi..." : "Joindre un rapport"}
                  <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleAvisFileChange} />
                </Button>
                {avisForm.rapportUrl && (
                  <Typography variant="caption" color="text.secondary">
                    {avisForm.rapportUrl.split("/").pop()}
                  </Typography>
                )}
                {(avisBlobUrl ?? avisForm.rapportUrl) && !avisUploading && (
                  <Button size="small" variant="text"
                    onClick={() => window.open((avisBlobUrl ?? avisForm.rapportUrl)!, "_blank")}
                  >
                    Visualiser
                  </Button>
                )}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvisDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            disabled={avisSaving || !avisForm.nomPrenom || !avisForm.dateAvis || !avisForm.contenu}
            onClick={saveAvis}
            startIcon={avisSaving ? <CircularProgress size={16} /> : undefined}
          >
            {editingAvis ? "Enregistrer" : "Ajouter"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog confirmation clôture ───────────────────────────────────── */}
      <Dialog open={confirmClose} onClose={() => setConfirmClose(false)}>
        <DialogTitle>Clôturer la visite ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Cette action est irréversible. La visite passera au statut <strong>Clôturée</strong>.
            Assurez-vous que le formulaire est complet avant de continuer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClose(false)}>Annuler</Button>
          <Button
            variant="contained" color="success"
            onClick={handleCloturer}
            disabled={closing}
            startIcon={closing ? <CircularProgress size={16} /> : <CheckCircleOutlineIcon />}
          >
            Confirmer la clôture
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}