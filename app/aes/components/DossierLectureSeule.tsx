"use client";

// Parties déjà construites du dossier, en lecture seule : renseignements personnels et antécédents
// (dernières données renseignées).
import { Alert, Box, Divider, Grid, Paper, Typography } from "@mui/material";
import dayjs from "dayjs";
import SectionRenderer from "@/app/formulaires/examen/components/SectionRenderer";
import { ANTECEDENTS_PROFESSIONNELS } from "@/app/formulaires/examen/config/antecedentsProfessionnels";
import AntecedentsFamiliaux from "@/app/formulaires/components/sections/AntecedentsFamiliaux";
import type { DossierAesApi } from "../types";

const STATUT_SOCIAL: Record<string, string> = { CELIBATAIRE: "Célibataire", MARIE: "Marié(e)", DIVORCE: "Divorcé(e)", VEUF: "Veuf / Veuve" };

function Ligne({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box sx={{ display: "flex", gap: 1, py: 0.25 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value || "—"}</Typography>
    </Box>
  );
}

export default function DossierLectureSeule({ data }: { data: DossierAesApi }) {
  const p = data.visite.personnel;
  const d = data.dossier;
  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Lecture seule — dernières données renseignées
        {d.formulaireDu ? ` (formulaire du ${dayjs(d.formulaireDu).format("DD/MM/YYYY")})` : " (aucun formulaire antérieur)"}. Pour
        les modifier, passer par une visite avec formulaire.
      </Alert>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={1}>
          Renseignements personnels
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Ligne label="Nom" value={`${p.lastName} ${p.firstName}`} />
            <Ligne label="PPR" value={p.matricule} />
            <Ligne label="Date de naissance" value={p.dateNaissance ? dayjs(p.dateNaissance).format("DD/MM/YYYY") : null} />
            <Ligne label="Sexe" value={p.sexe === "H" ? "Homme" : p.sexe === "F" ? "Femme" : null} />
            <Ligne label="Statut social" value={p.statutSocial ? STATUT_SOCIAL[p.statutSocial] : null} />
            <Ligne label="Nombre d'enfants" value={d.nombreEnfants} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Ligne label="Poste" value={p.poste?.libelle} />
            <Ligne label="Service" value={p.service?.libelle} />
            <Ligne label="Formation" value={p.formation?.libelle} />
          </Grid>
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={1}>
          Antécédents personnels
        </Typography>
        {d.pathologies.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Aucune pathologie enregistrée.
          </Typography>
        ) : (
          d.pathologies.map((x, i) => (
            <Typography key={i} variant="body2">
              • {x.code} — {x.libelle} ({dayjs(x.date).format("DD/MM/YYYY")}){x.commentaire ? ` : ${x.commentaire}` : ""}
            </Typography>
          ))
        )}
        <Divider sx={{ my: 1.5 }} />
        <Ligne label="Chirurgicaux" value={d.antecedentsChirurgicaux} />
        <Box mt={1}>
          <Typography variant="body2" color="text.secondary">
            Synthèse des antécédents
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {d.synthese || "—"}
          </Typography>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={1}>
          Antécédents familiaux
        </Typography>
        <AntecedentsFamiliaux readOnly value={d.antecedentsFamiliaux} onChange={() => {}} />
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={1}>
          Antécédents professionnels
        </Typography>
        <SectionRenderer
          section={ANTECEDENTS_PROFESSIONNELS}
          values={d.antecedentsProfessionnels}
          onChange={() => {}}
          ctx={{ readOnly: true }}
          champPrefix="antecedents"
        />
      </Paper>
    </Box>
  );
}
