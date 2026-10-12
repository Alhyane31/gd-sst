"use client";

import {
  Box,
  Button,
  Grid,
  IconButton,
  TextField,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useEffect, useState } from "react";
import type { ChangeHandler, ExperienceAnterieure, FormData, Grade } from "../types";

const EXPERIENCE_VIDE: ExperienceAnterieure = { secteur: "", lieu: "", du: "", au: "", horaires: "" };

// Durée cumulée en années entières (pour la colonne historique autreDureeAnnees)
function dureeTotaleAnnees(list: ExperienceAnterieure[]) {
  const ms = list.reduce((sum, e) => {
    const du = new Date(e.du).getTime();
    const au = new Date(e.au).getTime();
    return !isNaN(du) && !isNaN(au) && au > du ? sum + (au - du) : sum;
  }, 0);
  return ms > 0 ? String(Math.floor(ms / (365.25 * 24 * 3600 * 1000))) : "";
}

const GRADES: { value: Exclude<Grade, "">; label: string }[] = [
  { value: "GRADE_4", label: "4ème grade" },
  { value: "GRADE_3", label: "3ème grade" },
  { value: "GRADE_2", label: "2ème grade" },
  { value: "GRADE_1", label: "1er grade" },
  { value: "GRADE_PRINCIPAL", label: "Grade principal" },
  { value: "GRADE_EXCEPTIONNEL", label: "Grade exceptionnel" },
  { value: "HORS_GRADE", label: "Hors grade" },
];

// Nombre d'années selon la catégorie de médecin (code PosteDetail)
const ANNEES_PAR_CATEGORIE: Record<string, number> = {
  MED_RESIDENT: 5,
  MED_INTERNE: 2,
};

type Option = {
  id: string;
  libelle: string;
  code?: string;
  categorieForm?: "A" | "B" | "C" | "D";
  details?: DetailOption[];
};

type DetailOption = {
  id: string;
  libelle: string;
  code?: string;
};

export default function InformationsProfessionnellesSection({
  data,
  onChange,
}: {
  data: FormData;
  onChange: ChangeHandler;
}) {
  const [formations, setFormations] = useState<Option[]>([]);
  const [services, setServices] = useState<Option[]>([]);
  const [postes, setPostes] = useState<Option[]>([]);
  const [detailsPoste, setDetailsPoste] = useState<DetailOption[]>([]);

  useEffect(() => {
    const load = async () => {
      const [formationsRes, postesRes] = await Promise.all([
        fetch("/api/formations"),
        fetch("/api/postes?isActive=true"),
      ]);

      const formationsPayload = await formationsRes.json().catch(() => []);
      const postesPayload = await postesRes.json().catch(() => []);

      setFormations(Array.isArray(formationsPayload) ? formationsPayload : formationsPayload.items ?? []);
      setPostes(Array.isArray(postesPayload) ? postesPayload : postesPayload.items ?? []);
    };

    load();
  }, []);

  useEffect(() => {
    const loadServices = async () => {
      if (!data.formationId) {
        setServices([]);
        return;
      }

      const res = await fetch(`/api/formations/${data.formationId}/services`);
      const payload = await res.json().catch(() => []);

      setServices(Array.isArray(payload) ? payload : payload.items ?? []);
    };

    loadServices();
  }, [data.formationId]);

 useEffect(() => {
  if (postes.length === 0) return; // ✅ attendre le chargement
  
  const selectedPoste = postes.find((p) => p.id === data.posteId);

  if (!selectedPoste) {
    setDetailsPoste([]);
    return;
  }

  onChange("categorieForm", selectedPoste.categorieForm ?? "");

  const details = selectedPoste.details ?? [];
  setDetailsPoste(details);

  if (details.length === 0) {
    onChange("detailPoste", "");
    onChange("detailPosteId", "");
  }
}, [data.posteId, postes]); // postes déjà dans les deps ✅

  // ── Établissements antérieurs ──
  const experiences = data.experiencesAnterieures ?? [];

  // Met à jour la liste + les colonnes historiques (lieu / durée / horaires)
  const setExperiences = (list: ExperienceAnterieure[]) => {
    onChange("experiencesAnterieures", list);
    onChange("lieuTravail", list.map((e) => e.lieu.trim()).filter(Boolean).join(" ; "));
    onChange("horaires", list.map((e) => e.horaires.trim()).filter(Boolean).join(" ; "));
    onChange("dureeAnnees", dureeTotaleAnnees(list));
  };

  const updateExperience = (index: number, patch: Partial<ExperienceAnterieure>) =>
    setExperiences(experiences.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  const selectedDetail = detailsPoste.find((d) => d.id === data.detailPosteId);
  const nbAnnees = ANNEES_PAR_CATEGORIE[selectedDetail?.code ?? ""] ?? 0;

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            select
            fullWidth
            sx={{ minWidth: 220 }}
            label="Formation"
            value={data.formationId ?? ""}
            onChange={(e) => {
              const id = e.target.value;
              const selected = formations.find((f) => f.id === id);

              onChange("formationId", id);
              onChange("formation", selected?.libelle ?? "");

              onChange("serviceId", "");
              onChange("service", "");
            }}
          >
            <MenuItem value="">Sélectionner</MenuItem>
            {formations.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                {f.libelle}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            select
            fullWidth
            sx={{ minWidth: 220 }}
            label="Service"
            value={data.serviceId ?? ""}
            disabled={!data.formationId}
            onChange={(e) => {
              const id = e.target.value;
              const selected = services.find((s) => s.id === id);

              onChange("serviceId", id);
              onChange("service", selected?.libelle ?? "");
            }}
          >
            <MenuItem value="">Sélectionner</MenuItem>
            {services.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.libelle}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            select
            fullWidth
            sx={{ minWidth: 220 }}
            label="Poste"
            value={data.posteId ?? ""}
            onChange={(e) => {
              const id = e.target.value;
              const selected = postes.find((p) => p.id === id);

              onChange("posteId", id);
              onChange("poste", selected?.libelle ?? "");
              onChange("posteCode", selected?.code ?? "");
              onChange("categorieForm", selected?.categorieForm ?? "");

              onChange("detailPosteId", "");
              onChange("detailPoste", "");
              onChange("anneeEtude", "");
            }}
          >
            <MenuItem value="">Sélectionner</MenuItem>
            {postes.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.libelle}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {detailsPoste.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              sx={{ minWidth: 220 }}
              label="Catégorie"
              value={data.detailPosteId ?? ""}
              onChange={(e) => {
                const id = e.target.value;
                const selected = detailsPoste.find((d) => d.id === id);

                onChange("detailPosteId", id);
                onChange("detailPoste", selected?.libelle ?? "");
                onChange("anneeEtude", "");
              }}
            >
              <MenuItem value="">Sélectionner</MenuItem>
              {detailsPoste.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.libelle}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        )}

        {nbAnnees > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              sx={{ minWidth: 220 }}
              label="Année"
              value={data.anneeEtude ?? ""}
              onChange={(e) => onChange("anneeEtude", e.target.value)}
            >
              <MenuItem value="">Sélectionner</MenuItem>
              {Array.from({ length: nbAnnees }, (_, i) => String(i + 1)).map((a) => (
                <MenuItem key={a} value={a}>
                  {a === "1" ? "1ère année" : `${a}ème année`}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            select
            fullWidth
            sx={{ minWidth: 220 }}
            label="Grade"
            value={data.grade ?? ""}
            onChange={(e) => onChange("grade", e.target.value as Grade)}
          >
            <MenuItem value="">Sélectionner</MenuItem>
            {GRADES.map((g) => (
              <MenuItem key={g.value} value={g.value}>
                {g.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            type="date"
            label="Date d’affectation"
            InputLabelProps={{ shrink: true }}
            value={data.dateAffectationChu}
            onChange={(e) => onChange("dateAffectationChu", e.target.value)}
          />
        </Grid>
      </Grid>

      <Box mt={3}>
        <Typography mb={1}>
          Exercice dans un autre établissement auparavant ?
        </Typography>

        <RadioGroup
          row
          value={data.autreEtablissement}
          onChange={(e) => {
            const value = e.target.value as FormData["autreEtablissement"];
            onChange("autreEtablissement", value);
            if (value === "oui" && experiences.length === 0) setExperiences([{ ...EXPERIENCE_VIDE }]);
            if (value === "non") setExperiences([]);
          }}
        >
          <FormControlLabel value="oui" control={<Radio />} label="Oui" />
          <FormControlLabel value="non" control={<Radio />} label="Non" />
        </RadioGroup>

        {data.autreEtablissement === "oui" && (
          <Box mt={1}>
            {experiences.map((exp, index) => {
              const datesInvalides = !!exp.du && !!exp.au && exp.au < exp.du;
              return (
                <Box
                  key={index}
                  sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-start", mb: 1.5 }}
                >
                  <TextField
                    select
                    label="Secteur"
                    sx={{ width: 150 }}
                    value={exp.secteur}
                    onChange={(e) =>
                      updateExperience(index, { secteur: e.target.value as ExperienceAnterieure["secteur"] })
                    }
                  >
                    <MenuItem value="">Sélectionner</MenuItem>
                    <MenuItem value="PUBLIC">Public</MenuItem>
                    <MenuItem value="PRIVE">Privé</MenuItem>
                  </TextField>
                  <TextField
                    label="Lieu"
                    sx={{ flex: "1 1 240px" }}
                    value={exp.lieu}
                    onChange={(e) => updateExperience(index, { lieu: e.target.value })}
                  />
                  <TextField
                    type="date"
                    label="Du"
                    sx={{ width: 170 }}
                    InputLabelProps={{ shrink: true }}
                    value={exp.du}
                    onChange={(e) => updateExperience(index, { du: e.target.value })}
                  />
                  <TextField
                    type="date"
                    label="Au"
                    sx={{ width: 170 }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: exp.du || undefined }}
                    error={datesInvalides}
                    helperText={datesInvalides ? "Doit être après « Du »" : undefined}
                    value={exp.au}
                    onChange={(e) => updateExperience(index, { au: e.target.value })}
                  />
                  <TextField
                    label="Horaires"
                    sx={{ width: 180 }}
                    value={exp.horaires}
                    onChange={(e) => updateExperience(index, { horaires: e.target.value })}
                  />
                  <IconButton
                    color="error"
                    aria-label="Supprimer"
                    sx={{ mt: 1 }}
                    onClick={() => setExperiences(experiences.filter((_, i) => i !== index))}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Box>
              );
            })}

            <Button
              startIcon={<AddIcon />}
              onClick={() => setExperiences([...experiences, { ...EXPERIENCE_VIDE }])}
            >
              Ajouter un établissement
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}