"use client";

import { Box, Paper, Typography, Chip } from "@mui/material";

type PersonnelCategorie = "SMR" | "VP";

type PersonnelMini = {
  firstName: string;
  lastName: string;
  categorie?: PersonnelCategorie;
  tags?: string[];
  poste?: { libelle: string };
  service?: { libelle: string };
  formation?: { libelle: string };
};

export default function PersonnelHeaderReadonly({
  personnel,
}: {
  personnel: PersonnelMini;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 3,
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      {/* Nom + catégorie */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
          {personnel.lastName} {personnel.firstName}
        </Typography>

        {personnel.categorie && (
          <Chip
            size="small"
            label={personnel.categorie}
            color={personnel.categorie === "SMR" ? "warning" : "default"}
          />
        )}
      </Box>

      {/* Poste / service / formation */}
      <Typography variant="body2" color="text.secondary">
        {personnel.poste?.libelle ?? "-"} —{" "}
        {personnel.service?.libelle ?? "-"} —{" "}
        {personnel.formation?.libelle ?? "-"}
      </Typography>

      {/* Tags */}
      {(personnel.tags?.length ?? 0) > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
          {personnel.tags!.map((t) => (
            <Chip key={t} size="small" label={t} variant="outlined" />
          ))}
        </Box>
      )}
    </Paper>
  );
}
