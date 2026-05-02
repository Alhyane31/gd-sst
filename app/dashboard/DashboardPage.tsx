"use client";

import { useEffect, useState } from "react";
import {
  Box, Grid, Paper, Typography, CircularProgress, Divider,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AssignmentLateIcon from "@mui/icons-material/AssignmentLate";
import DescriptionIcon from "@mui/icons-material/Description";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const PIE_COLORS = ["#1976d2", "#42a5f5", "#0d47a1", "#64b5f6", "#1565c0", "#90caf9", "#0a2f6b", "#bbdefb", "#e3f2fd"];
const BAR_COLOR = "#1976d2";
const BAR2_COLOR = "#42a5f5";

type Stats = {
  kpis: {
    personnelActif: number;
    visitesMonth: number;
    convocationsEnAttente: number;
    formulairesDraft: number;
  };
  visitesByType: { name: string; value: number }[];
  visitesParMois: { mois: string; count: number }[];
  convocationsParStatut: { name: string; count: number }[];
};

function KpiCard({
  label, value, icon, color,
}: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <Paper elevation={3} sx={{ p: 3, display: "flex", alignItems: "center", gap: 2, borderTop: `4px solid ${color}` }}>
      <Box sx={{ bgcolor: color + "22", borderRadius: "50%", p: 1.5, display: "flex" }}>
        <Box sx={{ color }}>{icon}</Box>
      </Box>
      <Box>
        <Typography variant="h4" fontWeight={700} lineHeight={1}>{value}</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>{label}</Typography>
      </Box>
    </Paper>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => { setError("Impossible de charger les données."); setLoading(false); });
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" p={8}><CircularProgress /></Box>;
  if (error || !stats) return <Typography color="error" p={4}>{error || "Erreur"}</Typography>;

  const { kpis, visitesByType, visitesParMois, convocationsParStatut } = stats;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Tableau de bord</Typography>

      {/* KPIs */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard label="Personnel actif" value={kpis.personnelActif} icon={<PeopleIcon />} color="#1976d2" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard label="Visites ce mois" value={kpis.visitesMonth} icon={<EventNoteIcon />} color="#388e3c" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard label="Convocations en attente" value={kpis.convocationsEnAttente} icon={<AssignmentLateIcon />} color="#f57c00" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard label="Formulaires non soumis" value={kpis.formulairesDraft} icon={<DescriptionIcon />} color="#7b1fa2" />
        </Grid>
      </Grid>

      {/* Graphiques ligne 1 */}
      <Grid container spacing={3} mb={3}>
        {/* Visites par mois */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>Visites — 6 derniers mois</Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={visitesParMois} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Visites" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Répartition par type */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>Répartition par type de visite</Typography>
            <Divider sx={{ mb: 2 }} />
            {visitesByType.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" mt={4}>Aucune donnée</Typography>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={visitesByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {visitesByType.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Graphique ligne 2 */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>Convocations par statut</Typography>
            <Divider sx={{ mb: 2 }} />
            {convocationsParStatut.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" mt={4}>Aucune donnée</Typography>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={convocationsParStatut}
                  layout="vertical"
                  margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={110} />
                  <Tooltip />
                  <Bar dataKey="count" name="Convocations" fill={BAR2_COLOR} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
