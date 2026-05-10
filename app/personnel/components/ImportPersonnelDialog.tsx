"use client";

import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Stack, Tab, Table, TableBody, TableCell,
  TableHead, TableRow, Tabs, Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useRef, useState } from "react";

const TEMPLATE_HEADERS = "matricule;nom;prenom;email;dateNaissance;statutSocial;codePoste;codeFormation;codeService;categorie;dateAffectation";
const TEMPLATE_EXAMPLE = "M001;DUPONT;Jean;jean.dupont@example.com;01/01/1980;MARIE;CODE_POSTE;CODE_FORM;CODE_SVC;VP;15/03/2024";

type OkItem  = { ligne: number; nom: string; prenom: string; matricule?: string };
type ErrItem = { ligne: number; nom: string; prenom: string; raison: string };
type Result  = { ok: OkItem[]; errors: ErrItem[]; totalImported: number };

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(";").map((h) => h.replace(/^["']|["']$/g, "").trim());
  return lines.slice(1).map((line) => {
    const vals = line.split(";").map((v) => v.replace(/^["']|["']$/g, "").trim());
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
  });
}

function downloadTemplate() {
  const content = `${TEMPLATE_HEADERS}\n${TEMPLATE_EXAMPLE}`;
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "canevas_import_personnel.csv";
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

type Props = { open: boolean; onClose: () => void; onSuccess: () => void };

export default function ImportPersonnelDialog({ open, onClose, onSuccess }: Props) {
  const fileRef           = useRef<HTMLInputElement>(null);
  const [fileName, setFileName]   = useState("");
  const [rows,     setRows]       = useState<Record<string, string>[]>([]);
  const [loading,  setLoading]    = useState(false);
  const [result,   setResult]     = useState<Result | null>(null);
  const [tab,      setTab]        = useState(0);
  const [error,    setError]      = useState("");

  const reset = () => {
    setFileName(""); setRows([]); setResult(null); setError(""); setTab(0);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null); setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCsv(text);
      setRows(parsed);
      if (parsed.length === 0) setError("Fichier vide ou format invalide (séparateur attendu : ;)");
    };
    reader.readAsText(file, "utf-8");
  };

  const handleImport = async () => {
    if (!rows.length) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/personnel/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data: Result = await res.json();
      if (!res.ok) { setError((data as any).error ?? "Erreur serveur"); return; }
      setResult(data);
      setTab(data.errors.length > 0 ? 1 : 0);
      if (data.totalImported > 0) onSuccess();
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Importer du personnel</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {/* Template download */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Button variant="outlined" startIcon={<DownloadIcon />} size="small" onClick={downloadTemplate}>
              Télécharger le canevas CSV
            </Button>
            <Typography variant="caption" color="text.secondary">
              Colonnes : {TEMPLATE_HEADERS}
            </Typography>
          </Box>

          {/* File input */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button variant="contained" startIcon={<UploadFileIcon />} size="small"
              onClick={() => fileRef.current?.click()}>
              Choisir un fichier CSV
            </Button>
            <input ref={fileRef} type="file" accept=".csv,.txt" hidden onChange={handleFile} />
            {fileName && (
              <Chip label={`${fileName} — ${rows.length} ligne(s) détectée(s)`} size="small" color="info" />
            )}
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          {/* Results */}
          {result && (
            <Box>
              <Stack direction="row" spacing={1} mb={1}>
                <Chip label={`${result.ok.length} OK`}      color="success" size="small" />
                <Chip label={`${result.errors.length} erreur(s)`} color="error" size="small" />
              </Stack>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
                <Tab label={`Lignes OK (${result.ok.length})`} />
                <Tab label={`Lignes à problème (${result.errors.length})`} />
              </Tabs>
              {tab === 0 && (
                <Box sx={{ maxHeight: 300, overflow: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow><TableCell>#</TableCell><TableCell>Nom</TableCell><TableCell>Prénom</TableCell><TableCell>Matricule</TableCell></TableRow>
                    </TableHead>
                    <TableBody>
                      {result.ok.map((r) => (
                        <TableRow key={r.ligne}>
                          <TableCell>{r.ligne}</TableCell>
                          <TableCell>{r.nom}</TableCell>
                          <TableCell>{r.prenom}</TableCell>
                          <TableCell>{r.matricule ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                      {result.ok.length === 0 && <TableRow><TableCell colSpan={4} align="center">Aucune ligne importée</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </Box>
              )}
              {tab === 1 && (
                <Box sx={{ maxHeight: 300, overflow: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow><TableCell>#</TableCell><TableCell>Nom</TableCell><TableCell>Prénom</TableCell><TableCell>Raison</TableCell></TableRow>
                    </TableHead>
                    <TableBody>
                      {result.errors.map((r) => (
                        <TableRow key={r.ligne}>
                          <TableCell>{r.ligne}</TableCell>
                          <TableCell>{r.nom}</TableCell>
                          <TableCell>{r.prenom}</TableCell>
                          <TableCell sx={{ color: "error.main" }}>{r.raison}</TableCell>
                        </TableRow>
                      ))}
                      {result.errors.length === 0 && <TableRow><TableCell colSpan={4} align="center">Aucune erreur</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          )}

          {loading && <Box display="flex" justifyContent="center"><CircularProgress size={24} /></Box>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Fermer</Button>
        {!result && (
          <Button variant="contained" onClick={handleImport} disabled={rows.length === 0 || loading}>
            {loading ? "Import en cours..." : `Valider et importer (${rows.length} ligne(s))`}
          </Button>
        )}
        {result && (
          <Button variant="outlined" onClick={reset}>Nouvel import</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
