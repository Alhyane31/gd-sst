"use client";

import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  Chip,
  IconButton,
  Divider,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type PersonnelCategorie = "SMR" | "VP";

export default function PersonnelEditPage() {
  const params = useParams();
  const id = Array.isArray((params as any).id) ? (params as any).id[0] : (params as any).id;

  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [postes, setPostes] = useState<any[]>([]);
  const [formations, setFormations] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  // tags (chips)
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    posteId: "",
    formationId: "",
    serviceId: "",
    isActive: true,

    // ✅ nouveaux champs
    categorie: "VP" as PersonnelCategorie,
  });

  const suggestedTags = useMemo(
    () => ["Femme enceinte", "Expertise", "CM", "Allergie", "AT", "AES"],
    []
  );

  // load data
  useEffect(() => {
    if (!id) return;

    const run = async () => {
      try {
        const [pRes, postesRes, formationsRes] = await Promise.all([
          fetch(`/api/personnel/${id}`),
          fetch(`/api/postes`),
          fetch(`/api/formations`),
        ]);

        if (!pRes.ok) throw new Error("Personnel introuvable");

        const p = await pRes.json();

        setPostes(postesRes.ok ? await postesRes.json() : []);
        setFormations(formationsRes.ok ? await formationsRes.json() : []);

        setForm({
          firstName: p.firstName ?? "",
          lastName: p.lastName ?? "",
          posteId: p.poste?.id ?? "",
          formationId: p.formation?.id ?? "",
          serviceId: p.service?.id ?? "",
          isActive: !!p.isActive,

          // ✅ read categorie (fallback VP)
          categorie: (p.categorie === "SMR" ? "SMR" : "VP") as PersonnelCategorie,
        });

        // ✅ read tags (fallback [])
        setTags(Array.isArray(p.tags) ? p.tags : []);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [id]);

  // fetch services when formation changes
  useEffect(() => {
    const run = async () => {
      if (!form.formationId) {
        setServices([]);
        return;
      }
      const res = await fetch(`/api/formations/${form.formationId}/services`);
      setServices(res.ok ? await res.json() : []);
    };
    run();
  }, [form.formationId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // formation change => reset service
    if (name === "formationId") {
      setForm((prev) => ({ ...prev, formationId: value, serviceId: "" }));
      return;
    }

    if (name === "isActive") {
      setForm((prev) => ({ ...prev, isActive: value === "true" }));
      return;
    }

    if (name === "categorie") {
      setForm((prev) => ({ ...prev, categorie: value as PersonnelCategorie }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // tags helpers
  const addTag = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    setTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
  };

  const removeTag = (t: string) => {
    setTags((prev) => prev.filter((x) => x !== t));
  };

  const handleAddTagClick = () => {
    // accepte aussi "a;b;c" ou "a, b"
    const parts = tagInput
      .split(/[;,]/)
      .map((x) => x.trim())
      .filter(Boolean);

    parts.forEach(addTag);
    setTagInput("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/personnel/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          posteId: form.posteId,
          formationId: form.formationId,
          serviceId: form.serviceId,
          isActive: form.isActive,

          // ✅ nouveaux champs
          categorie: form.categorie,
          tags, // string[]
        }),
      });

      if (!res.ok) throw new Error("Erreur sauvegarde");
      router.push(`/personnel/${id}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box p={4}>Chargement...</Box>;

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Modifier le personnel</Typography>
        <Button variant="outlined" onClick={() => router.back()}>
          Retour
        </Button>
      </Box>

      <Paper sx={{ p: 3 }} elevation={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Prénom" name="firstName" value={form.firstName} onChange={handleChange} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Nom" name="lastName" value={form.lastName} onChange={handleChange} />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="Poste" name="posteId" value={form.posteId} onChange={handleChange}>
              {postes.map((x) => (
                <MenuItem key={x.id} value={x.id}>
                  {x.libelle}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="Formation" name="formationId" value={form.formationId} onChange={handleChange}>
              {formations.map((x) => (
                <MenuItem key={x.id} value={x.id}>
                  {x.libelle}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Service"
              name="serviceId"
              value={form.serviceId}
              onChange={handleChange}
              disabled={!form.formationId}
            >
              {services.map((x) => (
                <MenuItem key={x.id} value={x.id}>
                  {x.libelle}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* ✅ Catégorie */}
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="Catégorie" name="categorie" value={form.categorie} onChange={handleChange}>
              <MenuItem value="VP">VP (Visite Périodique)</MenuItem>
              <MenuItem value="SMR">SMR (Surveillance Médicale Rapprochée)</MenuItem>
            </TextField>
          </Grid>

          {/* ✅ Statut actif */}
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="Statut" name="isActive" value={String(form.isActive)} onChange={handleChange}>
              <MenuItem value="true">Actif</MenuItem>
              <MenuItem value="false">Inactif</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          {/* ✅ Tags */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" mb={1}>
              Tags
            </Typography>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Ajouter un tag"
                  placeholder='Ex: "Femme enceinte" ou "CM;Expertise"'
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTagClick();
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4} display="flex" justifyContent="flex-end">
                <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddTagClick}>
                  Ajouter
                </Button>
              </Grid>

              <Grid item xs={12}>
                {tags.length === 0 ? (
                  <Typography color="text.secondary">Aucun tag</Typography>
                ) : (
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {tags.map((t) => (
                      <Chip
                        key={t}
                        label={t}
                        onDelete={() => removeTag(t)}
                        deleteIcon={<CloseIcon />}
                      />
                    ))}
                  </Box>
                )}
              </Grid>

              {/* suggestions */}
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Suggestions :
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {suggestedTags.map((t) => (
                    <Chip key={t} label={t} variant="outlined" onClick={() => addTag(t)} />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {/* actions */}
          <Grid item xs={12} display="flex" gap={2} justifyContent="flex-end" mt={1}>
            <Button variant="outlined" onClick={() => router.push(`/personnel/${id}`)}>
              Annuler
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
