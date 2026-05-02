"use client";

import {
  Box, Divider, Paper, Typography, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import BordereauHeader from "../components/BordereauHeader";
import BordereauConvocationsTable from "../components/BordereauConvocationsTable";
import AvailableConvocationsTable from "../components/AvailableConvocationsTable";
import GenerateBordereauButton from "../components/GenerateBordereauButton";
import DeleteBordereauButton from "../components/DeleteBordereauButton";
type BordereauStatut = "NOUVEAU" | "GENERE" | "ENVOYE";

type BordereauDetail = {
  id: string;
  serialNumber: string;
  statut: BordereauStatut;
  dateEdition: string | null;
  service: { id: string; libelle: string; formation?: { id: string; libelle: string } | null } | null;
};

type ConvocationStatut =
  | "A_CONVOQUER"
  | "CONVOCATION_GENEREE"
  | "ENVOYEE"
  | "A_RELANCER"
  | "RELANCEE"
  | "REALISEE"
  | "ANNULEE";


  
type ConvocationRow = {
  id: string;
  statut: ConvocationStatut;
  convocationType?: string | null;
  datePrevue: string | null;
  dateConvocation?: string | null;
  personnel?: { firstName?: string | null; lastName?: string | null } | null;
};

export default function BordereauDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray((params as any).id) ? (params as any).id[0] : (params as any).id;

  const [loading, setLoading] = useState(true);
  const [bordereau, setBordereau] = useState<BordereauDetail | null>(null);
  const [convocations, setConvocations] = useState<ConvocationRow[]>([]);

  const [openEnvoyer, setOpenEnvoyer] = useState(false);
  const [dateAccuse, setDateAccuse] = useState("");
  const [envoyerLoading, setEnvoyerLoading] = useState(false);
  const [envoyerError, setEnvoyerError] = useState("");

  const serviceId = useMemo(() => bordereau?.service?.id ?? "", [bordereau]);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bordereaux/${id}`);
      if (!res.ok) throw new Error("not found");

      const data = await res.json();

      // accepte 2 formats
      const b: BordereauDetail = data.bordereau ?? data;
      const cs: ConvocationRow[] = data.convocations ?? data.convocations ?? data.convocation ?? data.convocations ?? data.convocations ?? data.convocations;

      setBordereau(b);
      setConvocations(Array.isArray(cs) ? cs : b?.["convocations"] ?? []);
    } catch (e) {
      console.error("GET bordereau detail error", e);
      setBordereau(null);
      setConvocations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <Box p={4}>Chargement...</Box>;
  if (!bordereau) return <Box p={4}>Bordereau introuvable</Box>;

  const isNouveau = bordereau.statut === "NOUVEAU";
  const isGenere  = bordereau.statut === "GENERE";

  const handleEnvoyer = async () => {
    if (!dateAccuse) { setEnvoyerError("Veuillez renseigner la date d'accusé de réception."); return; }
    setEnvoyerLoading(true);
    setEnvoyerError("");
    try {
      const res = await fetch(`/api/bordereaux/${id}/envoyer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateAccuseReception: dateAccuse }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Erreur serveur");
      setOpenEnvoyer(false);
      setDateAccuse("");
      await refresh();
    } catch (e: any) {
      setEnvoyerError(e?.message ?? "Erreur inconnue");
    } finally {
      setEnvoyerLoading(false);
    }
  };

  return (
    <Box p={4}>
      <BordereauHeader bordereau={bordereau} onBack={() => router.push("/bordereaux")} />

      <Box display="flex" justifyContent="flex-end" gap={2} mb={2}>
        <DeleteBordereauButton
          bordereauId={bordereau.id}
          disabled={!isNouveau}
          onDeleted={async () => { await refresh(); router.push("/bordereaux"); }}
        />
        <GenerateBordereauButton
          bordereauId={bordereau.id}
          disabled={!isNouveau}
          onGenerated={async () => { await refresh(); }}
        />
        <Button
          variant="contained"
          color="success"
          startIcon={<SendIcon />}
          disabled={!isGenere}
          onClick={() => { setEnvoyerError(""); setOpenEnvoyer(true); }}
        >
          Envoyé
        </Button>
      </Box>

      {/* Dialog accusé de réception */}
      <Dialog open={openEnvoyer} onClose={() => setOpenEnvoyer(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Marquer comme envoyé</DialogTitle>
        <DialogContent>
          {envoyerError && <Alert severity="error" sx={{ mb: 2 }}>{envoyerError}</Alert>}
          <TextField
            fullWidth
            type="date"
            label="Date d'accusé de réception"
            value={dateAccuse}
            onChange={(e) => setDateAccuse(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEnvoyer(false)} disabled={envoyerLoading}>Annuler</Button>
          <Button variant="contained" color="success" onClick={handleEnvoyer} disabled={envoyerLoading}>
            {envoyerLoading ? "Enregistrement..." : "Confirmer"}
          </Button>
        </DialogActions>
      </Dialog>

      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Convocations du bordereau
        </Typography>

        <BordereauConvocationsTable
          bordereauId={bordereau.id}
          rows={convocations}
          canEdit={isNouveau}
          onChanged={refresh}
        />

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 1 }}>
          Convocations disponibles (À convoquer)
        </Typography>

        <AvailableConvocationsTable
          bordereauId={bordereau.id}
          serviceId={serviceId}
          disabled={!isNouveau}
          onChanged={refresh}
        />
      </Paper>
    </Box>
  );
}
