"use client";

import { Box, Divider, Paper, Typography } from "@mui/material";
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

  return (
    <Box p={4}>
      <BordereauHeader bordereau={bordereau} onBack={() => router.push("/bordereaux")} />

      <Box display="flex" justifyContent="flex-end" gap={2} mb={2}>
        <DeleteBordereauButton
  bordereauId={bordereau.id}
  disabled={!isNouveau}
  onDeleted={async () => {
    await refresh();
    router.push("/bordereaux")// optionnel:  si tu veux revenir à la liste après suppression
  }}
/>
        <GenerateBordereauButton
          bordereauId={bordereau.id}
          disabled={!isNouveau}
          onGenerated={async () => {
            await refresh();
          }}
        />
      </Box>

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
          Convocations disponibles (A_CONVOQUER)
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
