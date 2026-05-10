"use client";

import {
  Box,
  Grid,
  TextField,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { ChangeHandler, FormData } from "../types";

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

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
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

        <Grid item xs={12} md={6}>
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

        <Grid item xs={12} md={6}>
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
              onChange("categorieForm", selected?.categorieForm ?? "");

              onChange("detailPosteId", "");
              onChange("detailPoste", "");
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
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              sx={{ minWidth: 220 }}
              label="Détail du poste"
              value={data.detailPosteId ?? ""}
              onChange={(e) => {
                const id = e.target.value;
                const selected = detailsPoste.find((d) => d.id === id);

                onChange("detailPosteId", id);
                onChange("detailPoste", selected?.libelle ?? "");
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

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Date d’affectation CHU"
            InputLabelProps={{ shrink: true }}
            value={data.dateAffectationChu}
            onChange={(e) => onChange("dateAffectationChu", e.target.value)}
          />
        </Grid>
      </Grid>

      <Box mt={3}>
        <Typography mb={1}>
          Exercice dans un établissement autre que le CHU auparavant ?
        </Typography>

        <RadioGroup
          row
          value={data.autreEtablissement}
          onChange={(e) => onChange("autreEtablissement", e.target.value)}
        >
          <FormControlLabel value="oui" control={<Radio />} label="Oui" />
          <FormControlLabel value="non" control={<Radio />} label="Non" />
        </RadioGroup>

        {data.autreEtablissement === "oui" && (
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Lieu de travail"
                value={data.lieuTravail}
                onChange={(e) => onChange("lieuTravail", e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Durée (années)"
                value={data.dureeAnnees}
                onChange={(e) => onChange("dureeAnnees", e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Horaires"
                value={data.horaires}
                onChange={(e) => onChange("horaires", e.target.value)}
              />
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
}