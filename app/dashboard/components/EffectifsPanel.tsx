"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box, Grid, Paper, Typography, CircularProgress, Divider,
  FormControl, InputLabel, Select, MenuItem,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const PIE_COLORS = ["#1976d2", "#42a5f5", "#0d47a1", "#64b5f6", "#1565c0", "#90caf9", "#0a2f6b", "#bbdefb", "#e3f2fd"];
const BAR_COLOR = "#1976d2";
const BAR2_COLOR = "#00897b";
const BAR3_COLOR = "#7b1fa2";

type RefItem = { id: string; libelle: string };
type ServiceRefItem = RefItem & { formationId: string };

type EffectifsData = {
  totalActif: number;
  formations: RefItem[];
  services: ServiceRefItem[];
  postes: RefItem[];
  byFormation: { formationId: string; formation: string; count: number }[];
  byService: { serviceId: string; service: string; formationId: string; formation: string; count: number }[];
  byPoste: { posteId: string; poste: string; formationId: string; formation: string; count: number }[];
  byCategorieDetail: { categorie: string; formationId: string; serviceId: string; count: number }[];
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

export default function EffectifsPanel() {
  const [data, setData] = useState<EffectifsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formationFilter, setFormationFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/effectifs")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Impossible de charger les données."); setLoading(false); });
  }, []);

  const availableServices = useMemo(() => {
    if (!data) return [];
    return formationFilter ? data.services.filter((s) => s.formationId === formationFilter) : data.services;
  }, [data, formationFilter]);

  const handleFormationChange = (value: string) => {
    setFormationFilter(value);
    if (serviceFilter && data) {
      const svc = data.services.find((s) => s.id === serviceFilter);
      if (value && svc?.formationId !== value) setServiceFilter("");
    }
  };

  const handleServiceChange = (value: string) => {
    setServiceFilter(value);
    if (value && data) {
      const svc = data.services.find((s) => s.id === value);
      if (svc && !formationFilter) setFormationFilter(svc.formationId);
    }
  };

  const posteChartData = useMemo(() => {
    if (!data) return [];
    if (formationFilter) {
      return data.byPoste
        .filter((p) => p.formationId === formationFilter)
        .map((p) => ({ name: p.poste, count: p.count }))
        .sort((a, b) => b.count - a.count);
    }
    const agg = new Map<string, number>();
    for (const p of data.byPoste) agg.set(p.poste, (agg.get(p.poste) ?? 0) + p.count);
    return [...agg.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [data, formationFilter]);

  const serviceChartData = useMemo(() => {
    if (!data) return [];
    const list = formationFilter
      ? data.byService.filter((s) => s.formationId === formationFilter)
      : data.byService;
    return list.map((s) => ({ name: s.service, count: s.count })).sort((a, b) => b.count - a.count);
  }, [data, formationFilter]);

  const categorieChartData = useMemo(() => {
    if (!data) return [];
    const list = data.byCategorieDetail.filter((c) => {
      if (formationFilter && c.formationId !== formationFilter) return false;
      if (serviceFilter && c.serviceId !== serviceFilter) return false;
      return true;
    });
    const agg = new Map<string, number>();
    for (const c of list) agg.set(c.categorie, (agg.get(c.categorie) ?? 0) + c.count);
    return [...agg.entries()].map(([categorie, count]) => ({ categorie, count }));
  }, [data, formationFilter, serviceFilter]);

  if (loading) return <Box display="flex" justifyContent="center" p={8}><CircularProgress /></Box>;
  if (error || !data) return <Typography color="error" p={4}>{error || "Erreur"}</Typography>;

  const { totalActif, formations, byFormation } = data;

  const formationLabel = formationFilter ? formations.find((f) => f.id === formationFilter)?.libelle : "";
  const serviceLabel = serviceFilter ? availableServices.find((s) => s.id === serviceFilter)?.libelle
    ?? data.services.find((s) => s.id === serviceFilter)?.libelle : "";
  const filterSuffix = [formationLabel, serviceLabel].filter(Boolean).join(" — ");

  return (
    <Box>
      {/* KPI + filtres */}
      <Grid container spacing={3} mb={4} alignItems="stretch">
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard label="Effectif actif total" value={totalActif} icon={<GroupsIcon />} color="#1976d2" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Paper elevation={3} sx={{ p: 3, height: "100%", display: "flex", alignItems: "center" }}>
            <FormControl fullWidth size="small">
              <InputLabel id="effectifs-formation-filter">Filtrer par formation</InputLabel>
              <Select
                labelId="effectifs-formation-filter"
                label="Filtrer par formation"
                value={formationFilter}
                onChange={(e) => handleFormationChange(e.target.value)}
              >
                <MenuItem value="">Toutes les formations</MenuItem>
                {formations.map((f) => (
                  <MenuItem key={f.id} value={f.id}>{f.libelle}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Paper elevation={3} sx={{ p: 3, height: "100%", display: "flex", alignItems: "center" }}>
            <FormControl fullWidth size="small">
              <InputLabel id="effectifs-service-filter">Filtrer par service</InputLabel>
              <Select
                labelId="effectifs-service-filter"
                label="Filtrer par service"
                value={serviceFilter}
                onChange={(e) => handleServiceChange(e.target.value)}
              >
                <MenuItem value="">Tous les services</MenuItem>
                {availableServices.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.libelle}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        </Grid>
      </Grid>

      {/* Ligne 1 : formation + catégorie */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>Effectif par formation</Typography>
            <Divider sx={{ mb: 2 }} />
            {byFormation.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" mt={4}>Aucune donnée</Typography>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(220, byFormation.length * 40)}>
                <BarChart
                  data={byFormation}
                  layout="vertical"
                  margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="formation" tick={{ fontSize: 12 }} width={140} />
                  <Tooltip />
                  <Bar dataKey="count" name="Personnel" fill={BAR_COLOR} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Répartition par catégorie{filterSuffix ? ` — ${filterSuffix}` : ""}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {categorieChartData.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" mt={4}>Aucune donnée</Typography>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={categorieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="categorie"
                  >
                    {categorieChartData.map((_, i) => (
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

      {/* Ligne 2 : poste (filtrable) + service (filtrable) */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Effectif par poste{formationLabel ? ` — ${formationLabel}` : ""}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {posteChartData.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" mt={4}>Aucune donnée</Typography>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(220, posteChartData.length * 32)}>
                <BarChart
                  data={posteChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={160} />
                  <Tooltip />
                  <Bar dataKey="count" name="Personnel" fill={BAR2_COLOR} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Effectif par service{formationLabel ? ` — ${formationLabel}` : ""}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {serviceChartData.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" mt={4}>Aucune donnée</Typography>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(220, serviceChartData.length * 32)}>
                <BarChart
                  data={serviceChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={160} />
                  <Tooltip />
                  <Bar dataKey="count" name="Personnel" fill={BAR3_COLOR} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
