"use client";

import { Typography ,Divider, Box, Button, CircularProgress} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import { useEffect, useRef, useState } from "react";
import type { ChangeHandler, FormData } from "../types";
import { Grid, TextField, MenuItem } from "@mui/material";

// Photo servie par /api/photos/<PPR> (fichier photos/<PPR>.<ext>, extension indifférente)
function PhotoPersonnel({ ppr, readOnly }: { ppr: string; readOnly: boolean }) {
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0); // force le rechargement après envoi
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cleanPpr = ppr.trim();

  useEffect(() => {
    setError(false);
    setUploadError("");
  }, [cleanPpr]);

  const handleFile = async (file?: File) => {
    if (!file || !cleanPpr) return;
    setUploading(true);
    setUploadError("");
    try {
      const body = new window.FormData();
      body.append("file", file);
      const res = await fetch(`/api/photos/${encodeURIComponent(cleanPpr)}`, { method: "POST", body });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message ?? "Erreur lors de l'envoi");
      setError(false);
      setVersion(Date.now());
    } catch (e: any) {
      setUploadError(e?.message ?? "Erreur lors de l'envoi");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, width: 160, flexShrink: 0 }}>
      <PhotoCadre ppr={cleanPpr} version={version} error={error} onError={() => setError(true)} />

      {!readOnly && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Button
            size="small"
            variant="outlined"
            startIcon={uploading ? <CircularProgress size={14} /> : <PhotoCameraOutlinedIcon />}
            disabled={!cleanPpr || uploading}
            onClick={() => inputRef.current?.click()}
            sx={{ whiteSpace: "nowrap" }}
          >
            {error || !cleanPpr ? "Ajouter la photo" : "Changer la photo"}
          </Button>
          {!cleanPpr && (
            <Typography variant="caption" color="text.secondary" textAlign="center">
              Renseignez le PPR pour ajouter une photo
            </Typography>
          )}
          {uploadError && (
            <Typography variant="caption" color="error" textAlign="center">
              {uploadError}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}

function PhotoCadre({
  ppr,
  version,
  error,
  onError,
}: {
  ppr: string;
  version: number;
  error: boolean;
  onError: () => void;
}) {

  const frameSx = {
    width: 120,
    height: 150,
    flexShrink: 0,
    borderRadius: 1,
    border: 1,
    borderColor: "divider",
    overflow: "hidden",
  };

  if (!ppr || error) {
    return (
      <Box
        sx={{
          ...frameSx,
          borderStyle: "dashed",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "text.disabled",
          bgcolor: "action.hover",
        }}
      >
        <PersonOutlineIcon sx={{ fontSize: 48 }} />
        <Typography variant="caption">Aucune photo</Typography>
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={`/api/photos/${encodeURIComponent(ppr)}${version ? `?v=${version}` : ""}`}
      alt="Photo"
      onError={onError}
      sx={{ ...frameSx, objectFit: "cover" }}
    />
  );
}

export default function InformationsGeneralesSection({
  data,
  onChange,
  categoriePersonnel,
  readOnly = false,
}: {
  data: FormData;
  onChange: ChangeHandler;
  categoriePersonnel: string;
  readOnly?: boolean;
}) {
  return (
    <Grid container spacing={2}>
    <Box sx={{ width: "100%", display: "flex", gap: 3, alignItems: "flex-start" }}>
    <Grid container spacing={2} sx={{ flex: 1 }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label="Nom"
          sx={{ minWidth: 220 }}
          value={data.nom}
          onChange={(e) => onChange("nom", e.target.value)}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          sx={{ minWidth: 220 }}
          label="Prénom"
          value={data.prenom}
          onChange={(e) => onChange("prenom", e.target.value)}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          type="date"
          label="Date de naissance"
          sx={{ minWidth: 220 }}
          InputLabelProps={{ shrink: true }}
          value={data.dateNaissance}
          onChange={(e) => onChange("dateNaissance", e.target.value)}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
       <TextField
  select
  fullWidth
  sx={{ minWidth: 220 }}
  label="Statut social"
  value={data.statutSocial}
  onChange={(e) => onChange("statutSocial", e.target.value)}
>
  <MenuItem value="">Sélectionner</MenuItem>
  <MenuItem value="CELIBATAIRE">Célibataire</MenuItem>
  <MenuItem value="MARIE">Marié(e)</MenuItem>
  <MenuItem value="DIVORCE">Divorcé(e)</MenuItem>
  <MenuItem value="VEUF">Veuf / Veuve</MenuItem>
</TextField>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          select
          fullWidth
          sx={{ minWidth: 220 }}
          label="Sexe"
          value={data.sexe ?? ""}
          onChange={(e) => onChange("sexe", e.target.value as FormData["sexe"])}
        >
          <MenuItem value="">Sélectionner</MenuItem>
          <MenuItem value="H">Homme</MenuItem>
          <MenuItem value="F">Femme</MenuItem>
        </TextField>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          sx={{ minWidth: 220 }}
          label="PPR"
          value={data.matricule}
          onChange={(e) => onChange("matricule", e.target.value)}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          sx={{ minWidth: 220 }}
          label="Nombre d'enfants"
          inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 2 }}
          value={data.nombreEnfants ?? ""}
          onChange={(e) => onChange("nombreEnfants", e.target.value.replace(/\D/g, "").slice(0, 2))}
        />
      </Grid>
</Grid>
    <PhotoPersonnel ppr={data.matricule ?? ""} readOnly={readOnly} />
    </Box>
<Grid >
      
    {categoriePersonnel === "SMR" && (
  <>
  
  
    <Grid size={{ xs: 12 }}>
      
<Divider sx={{ my: 3 }} />
      <Typography variant="h6" mt={2} mb={2}>
        Motif de la consultation
      </Typography>

    
      <TextField
        select
        fullWidth
          sx={{ minWidth: 400 }}
        label="Motif de la consultation *"
        value={data.motifConsultation ?? ""}
        onChange={(e) => onChange("motifConsultation", e.target.value)}
      >
        <MenuItem value="">Sélectionner</MenuItem>
        <MenuItem value="TRAVAIL_NUIT">Travail de nuit</MenuItem>
        <MenuItem value="RAYONNEMENTS">Exposition aux rayonnements ionisants</MenuItem>
        <MenuItem value="EXPERTISE">Expertise médicale</MenuItem>
        <MenuItem value="PATHO_CHRONIQUE">
          Pathologie chronique / immunodépression
        </MenuItem>
        <MenuItem value="GROSSESSE">Grossesse</MenuItem>
        <MenuItem value="REPRISE_ARRET">
          Intégration après arrêt de travail
        </MenuItem>
        <MenuItem value="REPRISE_COMMISSION">
          Intégration après commission médicale d'embauche
        </MenuItem>
      </TextField>
    </Grid>
  </>
)}
    </Grid>
    </Grid>
    
  );
}