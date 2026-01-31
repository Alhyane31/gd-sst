"use client";

import { Box, Button, Paper, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PersonnelHeaderReadonly from "../components/PersonnelHeaderReadonly";
export default function ConvocationViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray((params as any).id) ? (params as any).id[0] : (params as any).id;

  const [loading, setLoading] = useState(true);
  const [c, setC] = useState<any>(null);
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

  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} `;
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

  if (loading) return <Box p={4}>Chargement...</Box>;
  if (!c) return <Box p={4}>Convocation introuvable</Box>;

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Convocation</Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={() =>  router.push(`/convocations`)}>Retour</Button>
          <Button variant="contained" onClick={() => router.push(`/convocations/${id}/edit`)}>
            Modifier
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        {/* 🔒 Personnel rappelé (non modifiable) */}
          <PersonnelHeaderReadonly personnel={c.personnel} />

        <Typography><b>Statut:</b> {STATUT_LABELS[c.statut] ?? c.statut}</Typography>
       
        <Typography><b>ConvocationType:</b> {CONVOCATION_TYPE_LABELS[c.convocationType] ?? c.convocationType}</Typography>
        <Typography>
  <b>Date prévue :</b> {formatDateTime(c.datePrevue)}
</Typography>

<Typography>
  <b>Date convocation :</b> {formatDate(c.dateConvocation)}
</Typography>
        <Typography><b>Commentaire:</b> {c.commentaire ?? "-"}</Typography>
      </Paper>
    </Box>
  );
}
