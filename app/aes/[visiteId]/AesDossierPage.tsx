"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockIcon from "@mui/icons-material/Lock";
import PrintIcon from "@mui/icons-material/Print";
import dayjs from "dayjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Annexes from "../components/Annexes";
import CalendrierSuivi from "../components/CalendrierSuivi";
import ClotureAes from "../components/ClotureAes";
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
          <ClotureAes visiteId={visiteId} declaration={declaration} onClosed={majDeclaration} />
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

    </Box>
  );
}
