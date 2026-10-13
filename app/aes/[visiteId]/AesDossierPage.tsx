"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockIcon from "@mui/icons-material/Lock";
import PrintIcon from "@mui/icons-material/Print";
import dayjs from "dayjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { suivisPourRegles } from "@/lib/aes/contexte";
import { peutCloturer } from "@/lib/aes/suivi";
import Annexes from "../components/Annexes";
import CalendrierSuivi from "../components/CalendrierSuivi";
import Consultations from "../components/Consultations";
import DeclarationForm from "../components/DeclarationForm";
import DossierLectureSeule from "../components/DossierLectureSeule";
import type { DeclarationApi, DossierAesApi } from "../types";

const ONGLETS = ["Dossier (lecture seule)", "Déclaration", "Calendrier de suivi", "Consultations de résultats", "Aides (annexes)"];

export default function AesDossierPage() {
  const router = useRouter();
  const params = useParams();
  const visiteId = String(Array.isArray(params.visiteId) ? params.visiteId[0] : params.visiteId);

  const [data, setData] = useState<DossierAesApi | null>(null);
  const [erreur, setErreur] = useState("");
  const [onglet, setOnglet] = useState(1);
  const [cloture, setCloture] = useState(false);
  const [motif, setMotif] = useState("");
  const [erreurCloture, setErreurCloture] = useState("");

  useEffect(() => {
    fetch(`/api/aes/${visiteId}`)
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.message ?? "Erreur de chargement");
        setData(payload);
      })
      .catch((e: Error) => setErreur(e.message));
  }, [visiteId]);

  if (erreur) return <Alert severity="error" sx={{ m: 3 }}>{erreur}</Alert>;
  if (!data) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  const declaration = data.declaration;
  const majDeclaration = (d: DeclarationApi) => setData((x) => (x ? { ...x, declaration: d } : x));
  const p = data.visite.personnel;

  const verifCloture = declaration
    ? peutCloturer(
        suivisPourRegles(declaration),
        declaration.consultations.map((c) => ({ visite: c.visite, conduite: c.data?.conduite })),
        motif || declaration.motifArretSuivi
      )
    : { ok: false };

  const cloturer = async () => {
    setErreurCloture("");
    const res = await fetch(`/api/aes/${visiteId}/cloture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motifArretSuivi: motif }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) return setErreurCloture(payload?.message ?? "Clôture impossible");
    majDeclaration(payload.declaration);
    setCloture(false);
  };

  return (
    <Box p={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" useFlexGap spacing={1}>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(`/visites/${visiteId}`)}>
            Visite
          </Button>
          <Typography variant="h5" fontWeight={700}>
            AES — {p.lastName} {p.firstName}
          </Typography>
          {declaration?.statut === "CLOTUREE" && (
            <Chip icon={<LockIcon />} label={`Clôturé le ${dayjs(declaration.clotureAt).format("DD/MM/YYYY")}`} />
          )}
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.open(`/aes/${visiteId}/imprimer`, "_blank")} disabled={!declaration}>
            Imprimer
          </Button>
          {declaration?.statut === "VALIDEE" && (
            <Button variant="contained" color="success" startIcon={<LockIcon />} onClick={() => setCloture(true)}>
              Clôturer le dossier
            </Button>
          )}
        </Stack>
      </Stack>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={onglet} onChange={(_, v) => setOnglet(v)} variant="scrollable" scrollButtons="auto">
          {ONGLETS.map((o) => (
            <Tab key={o} label={o} />
          ))}
        </Tabs>
      </Paper>

      <Box hidden={onglet !== 0}>{onglet === 0 && <DossierLectureSeule data={data} />}</Box>
      <Box hidden={onglet !== 1}>
        <DeclarationForm visiteId={visiteId} declaration={declaration} referentiel={data.referentiel} onSaved={majDeclaration} />
      </Box>
      <Box hidden={onglet !== 2}>{onglet === 2 && <CalendrierSuivi visiteId={visiteId} declaration={declaration} onSaved={majDeclaration} />}</Box>
      <Box hidden={onglet !== 3}>
        {onglet === 3 && <Consultations visiteId={visiteId} declaration={declaration} referentiel={data.referentiel} onSaved={majDeclaration} />}
      </Box>
      <Box hidden={onglet !== 4}>{onglet === 4 && <Annexes referentiel={data.referentiel} />}</Box>

      <Dialog open={cloture} onClose={() => setCloture(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Clôturer le dossier AES</DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={2}>
            La clôture est possible après la visite S12, ou après un arrêt justifié du suivi (consultation avec « Fin du suivi » ou
            « Arrêt du TPE (source négative) ») : dans ce cas, indiquez le motif. La visite sera également clôturée.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Motif de l'arrêt du suivi (si avant S12)"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
          />
          {!verifCloture.ok && "raison" in verifCloture && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {verifCloture.raison}
            </Alert>
          )}
          {erreurCloture && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {erreurCloture}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloture(false)}>Annuler</Button>
          <Button variant="contained" color="success" disabled={!verifCloture.ok} onClick={cloturer}>
            Clôturer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
