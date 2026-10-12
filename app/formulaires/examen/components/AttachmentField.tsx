"use client";

// Pièces jointes d'un champ (stockage protégé : /api/visites/[id]/pieces-jointes).
import { Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { useRef, useState } from "react";
import type { PieceJointeRef } from "../types";

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";

export default function AttachmentField({
  label,
  champ,
  visiteId,
  value,
  onChange,
  readOnly = false,
  help,
}: {
  label: string;
  /** identifiant du champ, enregistré avec la pièce (ex. "paraclinique.spirometrie.fichiers") */
  champ: string;
  visiteId?: string;
  value: unknown;
  onChange: (next: PieceJointeRef[]) => void;
  readOnly?: boolean;
  help?: string;
}) {
  const files = Array.isArray(value) ? (value as PieceJointeRef[]) : [];
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file?: File) => {
    if (!file || !visiteId) return;
    setUploading(true);
    setError("");
    try {
      const body = new window.FormData();
      body.append("file", file);
      body.append("champ", champ);
      const res = await fetch(`/api/visites/${visiteId}/pieces-jointes`, { method: "POST", body });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message ?? "Erreur lors de l'envoi");
      onChange([...files, { id: payload.id, nom: payload.nom }]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'envoi");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (id: string) => {
    // la pièce est retirée du dossier ; le fichier est supprimé côté serveur
    await fetch(`/api/pieces-jointes/${id}`, { method: "DELETE" }).catch(() => {});
    onChange(files.filter((f) => f.id !== id));
  };

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
        {label}
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
        {files.map((f) => (
          <Chip
            key={f.id}
            label={f.nom}
            component="a"
            href={`/api/pieces-jointes/${f.id}`}
            target="_blank"
            clickable
            onDelete={readOnly ? undefined : () => remove(f.id)}
          />
        ))}

        {!readOnly && (
          <>
            <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={(e) => upload(e.target.files?.[0])} />
            <Button
              size="small"
              variant="outlined"
              startIcon={uploading ? <CircularProgress size={14} /> : <AttachFileIcon />}
              disabled={uploading || !visiteId}
              onClick={() => inputRef.current?.click()}
            >
              Joindre un fichier
            </Button>
          </>
        )}
        {files.length === 0 && readOnly && (
          <Typography variant="body2" color="text.secondary">
            Aucune pièce jointe
          </Typography>
        )}
      </Stack>

      {(error || help) && (
        <Typography variant="caption" color={error ? "error" : "text.secondary"} display="block" mt={0.5}>
          {error || help}
        </Typography>
      )}
    </Box>
  );
}
