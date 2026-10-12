"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box, Grid, Paper, Typography, CircularProgress, Divider, TextField, Button, Stack,
} from "@mui/material";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const COLOR_CONVOC = "#1976d2";
const COLOR_PRESENCE = "#388e3c";

type SeriePoint = { label: string; convocations: number; presences: number };

type EvolutionData = {
  totaux: { convocations: number; presences: number };
  tauxPresence: number;
  moyennes: {
    jour: { convocations: number; presences: number };
    semaine: { convocations: number; presences: number };
    mois: { convocations: number; presences: number };
  };
  parJour: SeriePoint[];
  parSemaine: SeriePoint[];
  parMois: SeriePoint[];
};

function defaultRange() {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const fromDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate() + 1);
  const from = fromDate.toISOString().slice(0, 10);
  return { from, to };
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
}

function AverageCard({
  title, convocations, presences,
}: { title: string; convocations: number; presences: number }) {
  return (
    <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
      <Typography variant="subtitle2" color="text.secondary" mb={1}>{title}</Typography>
      <Stack direction="row" spacing={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} color={COLOR_CONVOC}>{fmt(convocations)}</Typography>
          <Typography variant="caption" color="text.secondary">Convocations</Typography>
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} color={COLOR_PRESENCE}>{fmt(presences)}</Typography>
          <Typography variant="caption" color="text.secondary">Présences</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function EvolutionChart({
  title, data,
}: { title: string; data: SeriePoint[] }) {
  const tickInterval = data.length > 20 ? Math.floor(data.length / 12) : 0;
  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="subtitle1" fontWeight={600} mb={2}>{title}</Typography>
      <Divider sx={{ mb: 2 }} />
      {data.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" mt={4}>Aucune donnée</Typography>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={tickInterval} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend iconType="circle" iconSize={10} />
            <Line type="monotone" dataKey="convocations" name="Convocations" stroke={COLOR_CONVOC} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="presences" name="Présences" stroke={COLOR_PRESENCE} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}

export default function ConvocationsEvolutionPanel() {
  const initial = useMemo(defaultRange, []);
  const [fromInput, setFromInput] = useState(initial.from);
  const [toInput, setToInput] = useState(initial.to);
  const [range, setRange] = useState(initial);
  const [data, setData] = useState<EvolutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/convocations-evolution?from=${range.from}&to=${range.to}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Impossible de charger les données."); setLoading(false); });
  }, [range]);

  const handleApply = () => setRange({ from: fromInput, to: toInput });
  const handleReset = () => {
    const d = defaultRange();
    setFromInput(d.from);
    setToInput(d.to);
    setRange(d);
  };

  return (
    <Box>
      {/* Filtre période */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <TextField
            label="Du"
            type="date"
            size="small"
            value={fromInput}
            onChange={(e) => setFromInput(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Au"
            type="date"
            size="small"
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" onClick={handleApply}>Appliquer</Button>
          <Button variant="text" onClick={handleReset}>Réinitialiser</Button>
        </Stack>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" p={8}><CircularProgress /></Box>
      ) : error || !data ? (
        <Typography color="error" p={4}>{error || "Erreur"}</Typography>
      ) : (
        <>
          {/* Moyennes */}
          <Grid container spacing={3} mb={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <AverageCard title="Moyenne par jour" convocations={data.moyennes.jour.convocations} presences={data.moyennes.jour.presences} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <AverageCard title="Moyenne par semaine" convocations={data.moyennes.semaine.convocations} presences={data.moyennes.semaine.presences} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <AverageCard title="Moyenne par mois" convocations={data.moyennes.mois.convocations} presences={data.moyennes.mois.presences} />
            </Grid>
          </Grid>

          {/* Totaux + taux de présence */}
          <Paper elevation={3} sx={{ p: 2, mb: 3, display: "flex", gap: 4, flexWrap: "wrap" }}>
            <Typography variant="body2">
              Total convocations : <strong>{data.totaux.convocations}</strong>
            </Typography>
            <Typography variant="body2">
              Total présences : <strong>{data.totaux.presences}</strong>
            </Typography>
            <Typography variant="body2">
              Taux de présence : <strong>{fmt(data.tauxPresence)} %</strong>
            </Typography>
          </Paper>

          {/* Graphiques d'évolution */}
          <Stack spacing={3}>
            <EvolutionChart title="Évolution journalière — Convocations vs Présences" data={data.parJour} />
            <EvolutionChart title="Évolution hebdomadaire — Convocations vs Présences" data={data.parSemaine} />
            <EvolutionChart title="Évolution mensuelle — Convocations vs Présences" data={data.parMois} />
          </Stack>
        </>
      )}
    </Box>
  );
}
