"use client";

import { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Grid, Paper, Typography } from "@mui/material";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Comptage, StatistiquesAes } from "@/lib/aes/statistiques";

function Kpi({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <Paper elevation={3} sx={{ p: 3, borderTop: "4px solid #c62828" }}>
      <Typography variant="h4" fontWeight={700} lineHeight={1}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" mt={0.5}>
        {label}
      </Typography>
      {detail && (
        <Typography variant="caption" color="text.secondary">
          {detail}
        </Typography>
      )}
    </Paper>
  );
}

function Graphique({ titre, donnees }: { titre: string; donnees: Comptage[] }) {
  const hauteur = Math.max(160, donnees.length * 34);
  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={700} mb={1}>
        {titre}
      </Typography>
      {donnees.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Aucune donnée.
        </Typography>
      ) : (
        <ResponsiveContainer width="100%" height={hauteur}>
          <BarChart data={donnees} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="libelle" width={220} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="nombre" name="AES" fill="#c62828" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}

export default function AesPanel() {
  const [data, setData] = useState<StatistiquesAes | null>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/aes")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setErreur("Impossible de charger les statistiques AES."));
  }, []);

  if (erreur) return <Alert severity="error">{erreur}</Alert>;
  if (!data) return <Box p={4} textAlign="center"><CircularProgress /></Box>;

  const pct = (v: number | null) => (v === null ? "—" : `${String(v).replace(".", ",")} %`);

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Déclarations AES validées ou clôturées (brouillons exclus).
      </Typography>
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Kpi label="AES déclarés" value={String(data.total)} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Kpi label="Taux de déclaration AT" value={pct(data.tauxDeclarationAT)} detail={`${data.declarationsATFaites} déclaration(s) faite(s)`} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Kpi
            label="Taux de suivi complet (S12 faite)"
            value={pct(data.tauxSuiviComplet)}
            detail={`${data.suivisComplets} / ${data.suivisEchus} suivi(s) arrivé(s) à échéance`}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Graphique titre="AES par service" donnees={data.parService} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Graphique titre="AES par geste en cause" donnees={data.parGeste} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Graphique titre="Causes principales identifiées" donnees={data.parCause} />
        </Grid>
      </Grid>
    </Box>
  );
}
