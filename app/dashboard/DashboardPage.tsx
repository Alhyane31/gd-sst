"use client";

import { useState } from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import OverviewPanel from "./components/OverviewPanel";
import EffectifsPanel from "./components/EffectifsPanel";
import MatricePosteFormationPanel from "./components/MatricePosteFormationPanel";
import ConvocationsEvolutionPanel from "./components/ConvocationsEvolutionPanel";
import AesPanel from "./components/AesPanel";

export default function DashboardPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Tableau de bord</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Vue générale" />
        <Tab label="Effectifs" />
        <Tab label="Matrice Poste × Formation" />
        <Tab label="Convocations vs Présence" />
        <Tab label="AES" />
      </Tabs>

      {tab === 0 && <OverviewPanel />}
      {tab === 1 && <EffectifsPanel />}
      {tab === 2 && <MatricePosteFormationPanel />}
      {tab === 3 && <ConvocationsEvolutionPanel />}
      {tab === 4 && <AesPanel />}
    </Box>
  );
}
