"use client";

import {
  Box, Button, CircularProgress, Divider, Typography,
  FormControl, FormControlLabel, Radio, RadioGroup,
  TextField,
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useEffect, useRef, useState } from "react";
import type { ChangeHandler, FormData } from "../types";

const DECISIONS = [
  { value: "AMENAGEMENT_POSTE",        label: "Aménagement de poste de travail" },
  { value: "RECLASSEMENT_PROFESSIONNEL", label: "Reclassement professionnel" },
  { value: "PAS_AMENAGEMENT",           label: "Pas de nécessité d'aménagement du poste de travail" },
  { value: "DECISION_DIFFEREE",         label: "Décision différée (en attente d'investigations)" },
  { value: "APTITUDE_REPRISE",          label: "Aptitude à reprendre le travail" },
  { value: "INAPTITUDE_REPRISE",        label: "Inaptitude à reprendre le travail" },
];

export default function ResultatExpertiseSection({
  data,
  onChange,
}: {
  data: FormData;
  onChange: ChangeHandler;
}) {
  const decision = data.expertiseDecision;
  const blobUrlRef = useRef<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); };
  }, []);

  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const blob = URL.createObjectURL(file);
    blobUrlRef.current = blob;
    setBlobUrl(blob);

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.url) {
        onChange("expertiseCertificatRepriseUrl", json.url);
      }
    } finally {
      setUploading(false);
    }
  };

  const previewUrl = blobUrl ?? (data.expertiseCertificatRepriseUrl || null);

  const showQ92 = decision === "AMENAGEMENT_POSTE";
  const showQ93 = decision === "RECLASSEMENT_PROFESSIONNEL";
  const showQ94 = decision === "APTITUDE_REPRISE";
  const showQ95 =
    decision === "AMENAGEMENT_POSTE" ||
    decision === "RECLASSEMENT_PROFESSIONNEL" ||
    decision === "PAS_AMENAGEMENT" ||
    decision === "DECISION_DIFFEREE" ||
    decision === "APTITUDE_REPRISE" ||
    decision === "INAPTITUDE_REPRISE";

  return (
    <Box>
      <Typography variant="h6" mb={2}>
        Analyse finale et Décision
      </Typography>

      {/* Q90 — Conclusion */}
      <Typography variant="subtitle1" mb={1}>
        Conclusion basée sur l'évaluation de l'état de santé et l'analyse du poste de travail *
      </Typography>
      <TextField
        fullWidth
        required
        multiline
        minRows={4}
        value={data.expertiseConclusion}
        onChange={(e) => onChange("expertiseConclusion", e.target.value)}
      />

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" mb={2}>
        Décision expertise
      </Typography>

      {/* Q91 — Décision finale */}
      <Typography variant="subtitle1" mb={1}>
        Décision finale *
      </Typography>
      <FormControl>
        <RadioGroup
          value={data.expertiseDecision}
          onChange={(e) => {
            onChange("expertiseDecision", e.target.value as FormData["expertiseDecision"]);
            // Reset sub-question fields when decision changes
            onChange("expertiseAmenagementRecommandations", "");
            onChange("expertiseReclassementPoste", "");
            onChange("expertiseCertificatRepriseUrl", "");
            onChange("expertiseDateTransmission", "");
          }}
        >
          {DECISIONS.map((d) => (
            <FormControlLabel key={d.value} value={d.value} control={<Radio />} label={d.label} />
          ))}
        </RadioGroup>
      </FormControl>

      {/* Q92 — Aménagement du poste */}
      {showQ92 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" mb={1}>
            Aménagement du poste de travail
          </Typography>
          <Typography variant="subtitle1" mb={1}>
            Préciser les recommandations en rapport avec l'aménagement du poste de travail
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={data.expertiseAmenagementRecommandations}
            onChange={(e) => onChange("expertiseAmenagementRecommandations", e.target.value)}
          />
        </>
      )}

      {/* Q93 — Reclassement professionnel */}
      {showQ93 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" mb={1}>
            Reclassement professionnel
          </Typography>
          <Typography variant="subtitle1" mb={1}>
            Préciser le poste de travail et/ou le service recommandés
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={data.expertiseReclassementPoste}
            onChange={(e) => onChange("expertiseReclassementPoste", e.target.value)}
          />
        </>
      )}

      {/* Q94 — Certificat de reprise */}
      {showQ94 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" mb={1}>
            Reprise de travail
          </Typography>
          <Typography variant="subtitle1" mb={1}>
            Certificat de reprise de travail *
          </Typography>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Button
              variant="outlined"
              component="label"
              startIcon={uploading ? <CircularProgress size={16} /> : <AttachFileIcon />}
              size="small"
              disabled={uploading}
            >
              {uploading ? "Envoi en cours..." : "Joindre le fichier"}
              <input
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
              />
            </Button>
            {data.expertiseCertificatRepriseUrl && (
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, wordBreak: "break-all" }}>
                {data.expertiseCertificatRepriseUrl.split("/").pop()}
              </Typography>
            )}
            {previewUrl && !uploading && (
              <Button
                variant="text"
                size="small"
                startIcon={<VisibilityIcon />}
                onClick={() => window.open(previewUrl, "_blank")}
              >
                Visualiser
              </Button>
            )}
          </Box>
        </>
      )}

      {/* Q95 — Date de transmission */}
      {showQ95 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" mb={1}>
            Date de transmission de la réponse d'Expertise Médicale au Service Administratif en charge *
          </Typography>
          <TextField
            type="date"
            required
            size="small"
            sx={{ minWidth: 220 }}
            value={data.expertiseDateTransmission}
            onChange={(e) => onChange("expertiseDateTransmission", e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </>
      )}
    </Box>
  );
}
