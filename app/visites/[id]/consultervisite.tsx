"use client";

import {
  Box, Paper, Typography, Chip, Button, Divider, Stack, Grid,
  CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions,
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

  useEffect(() => {
    if (!id) return;
    fetch(`/api/visites/${id}`)
      .then((r) => r.json())
      .then(setVisite)
      .finally(() => setLoading(false));
  }, [id]);

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

          {/* Placeholder futurs formulaires spécifiques */}
          {visite.formulaire && (
            <Box mt={3}>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Formulaires spécifiques (expertise, DSM-5, BAT…)
                </Typography>
                <Button size="small" variant="outlined" startIcon={<AddIcon />} disabled>
                  Ajouter un formulaire (bientôt)
                </Button>
              </Stack>
            </Box>
          )}
        </Paper>
      </Stack>

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