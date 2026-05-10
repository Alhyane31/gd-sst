"use client";

import {
  Alert, Box, Button, CircularProgress, Divider,
  FormControl, FormControlLabel, LinearProgress, Paper,
  Radio, RadioGroup, Stack, TextField, Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type VentilationQualite = "BONNE" | "MOYENNE" | "INSUFFISANTE" | "NULLE" | "";
type EclairageType = "NATUREL" | "ARTIFICIEL" | "MIXTE" | "";
type EclairageSuffisance = "BON" | "MOYEN" | "INSUFFISANT" | "";

interface EtudeData {
  etudeEnvisagee:           boolean | null;
  dateEnvoiDemande:         string;
  dureeCycleMinutes:        string;
  descriptionCycle:         string;
  nombrePatientsActes:      string;
  niveauBruitDb:            string;
  humiditeRelative:         string;
  ventilation:              VentilationQualite;
  commentaireEnvironnement: string;
  eclairageType:            EclairageType;
  eclairageSuffisance:      EclairageSuffisance;
  eclairementLux:           string;
  chargePhysiqueUrl:        string;
  chargeMentaleUrl:         string;
  commentaireFinal:         string;
}

const empty: EtudeData = {
  etudeEnvisagee: null,
  dateEnvoiDemande: "",
  dureeCycleMinutes: "",
  descriptionCycle: "",
  nombrePatientsActes: "",
  niveauBruitDb: "",
  humiditeRelative: "",
  ventilation: "",
  commentaireEnvironnement: "",
  eclairageType: "",
  eclairageSuffisance: "",
  eclairementLux: "",
  chargePhysiqueUrl: "",
  chargeMentaleUrl: "",
  commentaireFinal: "",
};

function apiToForm(d: any): EtudeData {
  return {
    etudeEnvisagee:           d.etudeEnvisagee ?? null,
    dateEnvoiDemande:         d.dateEnvoiDemande ? d.dateEnvoiDemande.substring(0, 10) : "",
    dureeCycleMinutes:        d.dureeCycleMinutes != null ? String(d.dureeCycleMinutes) : "",
    descriptionCycle:         d.descriptionCycle ?? "",
    nombrePatientsActes:      d.nombrePatientsActes != null ? String(d.nombrePatientsActes) : "",
    niveauBruitDb:            d.niveauBruitDb != null ? String(d.niveauBruitDb) : "",
    humiditeRelative:         d.humiditeRelative != null ? String(d.humiditeRelative) : "",
    ventilation:              d.ventilation ?? "",
    commentaireEnvironnement: d.commentaireEnvironnement ?? "",
    eclairageType:            d.eclairageType ?? "",
    eclairageSuffisance:      d.eclairageSuffisance ?? "",
    eclairementLux:           d.eclairementLux != null ? String(d.eclairementLux) : "",
    chargePhysiqueUrl:        d.chargePhysiqueUrl ?? "",
    chargeMentaleUrl:         d.chargeMentaleUrl ?? "",
    commentaireFinal:         d.commentaireFinal ?? "",
  };
}

export default function EtudeDePostePage() {
  const { visiteId } = useParams<{ visiteId: string }>();
  const router = useRouter();

  const [data, setData] = useState<EtudeData>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [readOnly, setReadOnly] = useState(false);

  const physBlobRef = useRef<string | null>(null);
  const mentBlobRef = useRef<string | null>(null);
  const [physBlob, setPhysBlob] = useState<string | null>(null);
  const [mentBlob, setMentBlob] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (physBlobRef.current) URL.revokeObjectURL(physBlobRef.current);
      if (mentBlobRef.current) URL.revokeObjectURL(mentBlobRef.current);
    };
  }, []);

  useEffect(() => {
    if (!visiteId) return;
    fetch(`/api/visites/${visiteId}/etude-de-poste`)
      .then((r) => r.json())
      .then((payload) => {
        if (payload.visiteStatut === "CLOTUREE") setReadOnly(true);
        if (payload.etudeDePoste) setData(apiToForm(payload.etudeDePoste));
      })
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [visiteId]);

  const set = <K extends keyof EtudeData>(k: K, v: EtudeData[K]) =>
    setData((prev) => ({ ...prev, [k]: v }));

  const uploadFile = async (
    file: File,
    blobRef: React.MutableRefObject<string | null>,
    setBlob: (u: string) => void,
    field: "chargePhysiqueUrl" | "chargeMentaleUrl"
  ) => {
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    const blob = URL.createObjectURL(file);
    blobRef.current = blob;
    setBlob(blob);

    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      set(field, url);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch(`/api/visites/${visiteId}/etude-de-poste`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          etudeEnvisagee: true,
          dureeCycleMinutes:   data.dureeCycleMinutes  ? Number(data.dureeCycleMinutes)  : null,
          nombrePatientsActes: data.nombrePatientsActes ? Number(data.nombrePatientsActes) : null,
          niveauBruitDb:       data.niveauBruitDb       ? Number(data.niveauBruitDb)       : null,
          humiditeRelative:    data.humiditeRelative     ? Number(data.humiditeRelative)    : null,
          eclairementLux:      data.eclairementLux       ? Number(data.eclairementLux)      : null,
          ventilation:         data.ventilation          || null,
          eclairageType:       data.eclairageType        || null,
          eclairageSuffisance: data.eclairageSuffisance  || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Erreur");
      setSuccess(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;

  return (
    <Box sx={{ px: "0.5cm", pt: 2, pb: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" fontWeight={600}>Étude de poste</Typography>
        <Button variant="text" onClick={() => router.back()}>← Retour à la visite</Button>
      </Stack>

      {readOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          La visite est clôturée — cette étude de poste est en lecture seule.
        </Alert>
      )}
      {error   && <Alert severity="error"   sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Enregistré avec succès.</Alert>}
      {saving  && <LinearProgress sx={{ mb: 2 }} />}

      <Paper sx={{ p: 3 }} elevation={2}>

        {/* ── Section 1 — Informations générales ── */}
        <Typography variant="h6" mb={2}>Informations générales</Typography>

        <Box>
          <Typography variant="subtitle1" mb={1}>Date de l'envoi de la demande d'étude de poste *</Typography>
          <TextField
            type="date"
            size="small"
            disabled={readOnly}
            value={data.dateEnvoiDemande}
            onChange={(e) => set("dateEnvoiDemande", e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>

        <>
          <Divider sx={{ my: 3 }} />

          {/* ── Section 2 — Données professionnelles ── */}
            <Typography variant="h6" mb={2}>Données professionnelles détaillées</Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" mb={1}>Durée d'un cycle complet de travail en minutes *</Typography>
                <TextField
                  type="number" size="small" disabled={readOnly}
                  value={data.dureeCycleMinutes}
                  onChange={(e) => set("dureeCycleMinutes", e.target.value)}
                  inputProps={{ min: 0 }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle1" mb={1}>
                  Description d'un cycle de travail, en précisant la durée de chaque tâche (Chronogramme) *
                </Typography>
                <TextField
                  fullWidth multiline minRows={4} disabled={readOnly}
                  value={data.descriptionCycle}
                  onChange={(e) => set("descriptionCycle", e.target.value)}
                />
              </Box>

              <Box>
                <Typography variant="subtitle1" mb={1}>Nombre moyen de patients/actes pris en charge par journée de travail *</Typography>
                <TextField
                  type="number" size="small" disabled={readOnly}
                  value={data.nombrePatientsActes}
                  onChange={(e) => set("nombrePatientsActes", e.target.value)}
                  inputProps={{ min: 0 }}
                />
              </Box>
            </Stack>

            <Divider sx={{ my: 3 }} />

            {/* ── Section 3 — Environnement de travail ── */}
            <Typography variant="h6" mb={2}>Analyse de l'environnement de travail</Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" mb={1}>Bruit — niveau sonore moyen *</Typography>
                <TextField
                  type="number" size="small" disabled={readOnly}
                  label="dB"
                  value={data.niveauBruitDb}
                  onChange={(e) => set("niveauBruitDb", e.target.value)}
                />
              </Box>

              <Box>
                <Typography variant="subtitle1" mb={1}>Humidité relative (%) *</Typography>
                <TextField
                  type="number" size="small" disabled={readOnly}
                  label="%"
                  value={data.humiditeRelative}
                  onChange={(e) => set("humiditeRelative", e.target.value)}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle1" mb={1}>Ventilation / Aération *</Typography>
                <FormControl disabled={readOnly}>
                  <RadioGroup row value={data.ventilation} onChange={(e) => set("ventilation", e.target.value as VentilationQualite)}>
                    <FormControlLabel value="BONNE"       control={<Radio />} label="Bonne" />
                    <FormControlLabel value="MOYENNE"     control={<Radio />} label="Moyenne" />
                    <FormControlLabel value="INSUFFISANTE" control={<Radio />} label="Insuffisante" />
                    <FormControlLabel value="NULLE"       control={<Radio />} label="Nulle" />
                  </RadioGroup>
                </FormControl>
              </Box>

              <Box>
                <Typography variant="subtitle1" mb={1}>Commentaire *</Typography>
                <TextField
                  fullWidth multiline minRows={3} disabled={readOnly}
                  value={data.commentaireEnvironnement}
                  onChange={(e) => set("commentaireEnvironnement", e.target.value)}
                />
              </Box>

              <Box>
                <Typography variant="subtitle1" mb={1}>Éclairage *</Typography>
                <FormControl disabled={readOnly}>
                  <RadioGroup row value={data.eclairageType} onChange={(e) => set("eclairageType", e.target.value as EclairageType)}>
                    <FormControlLabel value="NATUREL"    control={<Radio />} label="Naturel" />
                    <FormControlLabel value="ARTIFICIEL" control={<Radio />} label="Artificiel" />
                    <FormControlLabel value="MIXTE"      control={<Radio />} label="Mixte" />
                  </RadioGroup>
                </FormControl>
              </Box>

              <Box>
                <Typography variant="subtitle1" mb={1}>Suffisance de l'éclairage *</Typography>
                <FormControl disabled={readOnly}>
                  <RadioGroup row value={data.eclairageSuffisance} onChange={(e) => set("eclairageSuffisance", e.target.value as EclairageSuffisance)}>
                    <FormControlLabel value="BON"         control={<Radio />} label="Bon" />
                    <FormControlLabel value="MOYEN"       control={<Radio />} label="Moyen" />
                    <FormControlLabel value="INSUFFISANT" control={<Radio />} label="Insuffisant" />
                  </RadioGroup>
                </FormControl>
              </Box>

              <Box>
                <Typography variant="subtitle1" mb={1}>Éclairement mesuré au Luxmètre *</Typography>
                <TextField
                  type="number" size="small" disabled={readOnly}
                  label="Lux"
                  value={data.eclairementLux}
                  onChange={(e) => set("eclairementLux", e.target.value)}
                  inputProps={{ min: 0 }}
                />
              </Box>
            </Stack>
          </>

        <Divider sx={{ my: 3 }} />

        {/* ── Section 4 — Charge physique et mentale ── */}
        <Typography variant="h6" mb={2}>Évaluation de la charge physique et la charge mentale</Typography>

        <Stack spacing={3}>
          <FileField
            label="Évaluation de la charge physique"
            url={data.chargePhysiqueUrl}
            blobUrl={physBlob}
            disabled={readOnly}
            onChange={(file) => uploadFile(file, physBlobRef, setPhysBlob, "chargePhysiqueUrl")}
          />
          <FileField
            label="Évaluation de la charge mentale"
            url={data.chargeMentaleUrl}
            blobUrl={mentBlob}
            disabled={readOnly}
            onChange={(file) => uploadFile(file, mentBlobRef, setMentBlob, "chargeMentaleUrl")}
          />

          <Box>
            <Typography variant="subtitle1" mb={1}>Commentaire *</Typography>
            <TextField
              fullWidth multiline minRows={3} disabled={readOnly}
              value={data.commentaireFinal}
              onChange={(e) => set("commentaireFinal", e.target.value)}
            />
          </Box>
        </Stack>

        {!readOnly && (
          <Box mt={4} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

function FileField({
  label, url, blobUrl, disabled, onChange,
}: {
  label: string;
  url: string;
  blobUrl: string | null;
  disabled: boolean;
  onChange: (f: File) => void;
}) {
  const preview = blobUrl ?? (url || null);
  return (
    <Box>
      <Typography variant="subtitle1" mb={1}>{label}</Typography>
      <Stack direction="row" alignItems="center" gap={2} flexWrap="wrap">
        {!disabled && (
          <Button variant="outlined" component="label" startIcon={<AttachFileIcon />} size="small">
            Joindre le fichier
            <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onChange(f);
            }} />
          </Button>
        )}
        {url && (
          <Typography variant="body2" color="text.secondary">
            {url.split("/").pop()}
          </Typography>
        )}
        {preview && (
          <Button
            variant="text" size="small" startIcon={<VisibilityIcon />}
            onClick={() => window.open(preview, "_blank")}
          >
            Visualiser
          </Button>
        )}
      </Stack>
    </Box>
  );
}
