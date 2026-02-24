"use client";

import {
  Box,
  Button,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PersonnelHeaderReadonly from "../components/PersonnelHeaderReadonly";

type VisiteStatut = "BROUILLON" | "EN_COURS" | "CLOTUREE" | "ANNULEE";

export default function ConvocationViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray((params as any).id) ? (params as any).id[0] : (params as any).id;

  const [loading, setLoading] = useState(true);
  const [c, setC] = useState<any>(null);

  // Dialog state
  const [openStart, setOpenStart] = useState(false);
  const [startAt, setStartAt] = useState<string>(""); // yyyy-mm-ddTHH:mm
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string>("");

  const formatDateTime = (value?: string | Date | null) => {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "-";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  const formatDate = (value?: string | Date | null) => {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "-";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  const STATUT_LABELS: Record<string, string> = {
    A_CONVOQUER: "À convoquer",
    CONVOCATION_GENEREE: "Convocation générée",
    A_TRAITER: "À traiter",
    A_RELANCER: "À relancer",
    RELANCEE: "Relancée",
    REALISEE: "Réalisée",
    ANNULEE: "Annulée",
  };

  const CONVOCATION_TYPE_LABELS: Record<string, string> = {
    INITIALE: "Initiale",
    RELANCE_1: "Relance 1",
    RELANCE_2: "Relance 2",
    RELANCE_3: "Relance 3",
  };

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`/api/convocations/${id}`);
        if (!res.ok) throw new Error("Not found");
        setC(await res.json());
      } catch {
        setC(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) run();
  }, [id]);

  // ----- logique visite -----
  const visite = c?.visite ?? null; // <-- Assure-toi que ton API inclut `visite`
  const visiteStatut: VisiteStatut | null = visite?.statut ?? null;

  const hasVisite = !!visite?.id;
 const formulaire = visite?.formulaire ?? null; // nécessite include API
  const hasFormulaire = !!formulaire?.id;
  const visiteID = visite?.id as string | undefined;
  const formId = formulaire?.id as string | undefined;
  const isVisiteClosable = useMemo(() => {
    // une visite "en cours" = tout sauf clôturée/annulée
    if (!visiteStatut) return false;
    return visiteStatut !== "CLOTUREE" && visiteStatut !== "ANNULEE";
  }, [visiteStatut]);

  const primaryVisitButtonLabel = useMemo(() => {
    if (!hasVisite) return "Démarrer la visite";
    if (isVisiteClosable) return "Continuer la visite";
    return "Visualiser la visite";
  }, [hasVisite, isVisiteClosable]);

  const primaryVisitButtonAction = async () => {
    setActionError("");

    if (!hasVisite) {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(
        now.getHours()
      )}:${pad(now.getMinutes())}`;
      setStartAt(local);
      setOpenStart(true);
      return;
    }

    
    if (!hasFormulaire || !formId) {
      setActionError("Formulaire introuvable pour cette visite. Vérifie l'include API (visite.formulaire).");
      return;
    }

    // si visite en cours => edit formulaire, sinon view formulaire
    if (isVisiteClosable) router.push(`/formulaires/${visiteID}/edit`);
    else router.push(`/formulaires/${visiteID}`);
  };

   const handleConfirmStart = async () => {
    if (!startAt) {
      setActionError("Veuillez renseigner la date et l’heure de début.");
      return;
    }

    setActionLoading(true);
    setActionError("");

    try {
      const res = await fetch(`/api/convocations/${id}/start-visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateDebut: startAt }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.message || "Impossible de démarrer la visite.");
      }

      // ✅ on redirige vers le FORMULAIRE créé
      const formulaireId = payload?.formulaireId as string | undefined;
      if (!formulaireId) throw new Error("Réponse API invalide: formulaireId manquant.");

      setOpenStart(false);

      // optionnel: rafraîchir convocation
      const ref = await fetch(`/api/convocations/${id}`);
      if (ref.ok) setC(await ref.json());

      router.push(`/formulaires/${formulaireId}/edit`);
    } catch (e: any) {
      setActionError(e?.message ?? "Erreur inconnue");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Box p={4}>Chargement...</Box>;
  if (!c) return <Box p={4}>Convocation introuvable</Box>;

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Convocation</Typography>

        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={() => router.push(`/convocations`)}>
            Retour
          </Button>

          {/* ✅ bouton visite */}
          <Button variant="contained" onClick={primaryVisitButtonAction}>
            {primaryVisitButtonLabel}
          </Button>

          <Button variant="outlined" onClick={() => router.push(`/convocations/${id}/edit`)}>
            Modifier
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        <PersonnelHeaderReadonly personnel={c.personnel} />

        <Typography>
          <b>Statut:</b> {STATUT_LABELS[c.statut] ?? c.statut}
        </Typography>

        <Typography>
          <b>Type:</b> {CONVOCATION_TYPE_LABELS[c.convocationType] ?? c.convocationType}
        </Typography>

        <Typography>
          <b>Date prévue :</b> {formatDateTime(c.datePrevue)}
        </Typography>

        <Typography>
          <b>Date convocation :</b> {formatDate(c.dateConvocation)}
        </Typography>

        <Typography>
          <b>Commentaire:</b> {c.commentaire ?? "-"}
        </Typography>

        {/* ✅ résumé visite si existe */}
        {hasVisite && (
          <Box mt={2}>
            <Typography variant="h6" mb={1}>
              Visite liée
            </Typography>
            <Typography>
              <b>Statut visite :</b> {visite?.statut ?? "-"}
            </Typography>
            <Typography>
              <b>Début :</b> {formatDateTime(visite?.dateDebut)}
            </Typography>
            <Typography>
              <b>Fin :</b> {formatDateTime(visite?.dateFin)}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* ===== Dialog démarrer visite ===== */}
      <Dialog open={openStart} onClose={() => (actionLoading ? null : setOpenStart(false))} fullWidth maxWidth="sm">
        <DialogTitle>Démarrer la visite</DialogTitle>
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

            <Typography variant="body2" color="text.secondary" mt={1}>
              La visite et le formulaire seront créés et initialisés avec les données actuelles du personnel.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button disabled={actionLoading} onClick={() => setOpenStart(false)}>
            Annuler
          </Button>
          <Button variant="contained" disabled={actionLoading} onClick={handleConfirmStart}>
            {actionLoading ? "Création..." : "Démarrer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}