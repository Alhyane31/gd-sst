"use client";

// Compte rendu imprimable du dossier AES : déclaration, calendrier, consultations, annexes D, F, G.
import { Alert, Box, Button, CircularProgress, Divider, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import dayjs from "dayjs";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SUIVI_LIBELLES, SUIVI_STATUT_LIBELLES, BILAN_LIBELLES, type Bilan, type SuiviCode, type SuiviStatut } from "@/lib/aes/codes";
import { contexteAes } from "@/lib/aes/contexte";
import { AnnexeTable } from "../../components/Annexes";
import { CONSULTATION_AES } from "../../config/consultation";
import { DECLARATION_AES, sectionVisible } from "../../config/declaration";
import { lignesSection } from "../../lecture";
import type { DossierAesApi } from "../../types";

function Lignes({ lignes }: { lignes: { label: string; valeur: string }[] }) {
  if (!lignes.length) return <Typography variant="body2" color="text.secondary">Non renseigné.</Typography>;
  return (
    <Table size="small">
      <TableBody>
        {lignes.map((l) => (
          <TableRow key={l.label}>
            <TableCell sx={{ width: "38%", color: "text.secondary", py: 0.5 }}>{l.label}</TableCell>
            <TableCell sx={{ py: 0.5 }}>{l.valeur}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function ImpressionAes() {
  const params = useParams();
  const visiteId = String(Array.isArray(params.visiteId) ? params.visiteId[0] : params.visiteId);
  const [data, setData] = useState<DossierAesApi | null>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    fetch(`/api/aes/${visiteId}`)
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.message ?? "Erreur de chargement");
        setData(payload);
      })
      .catch((e: Error) => setErreur(e.message));
  }, [visiteId]);

  if (erreur) return <Alert severity="error" sx={{ m: 3 }}>{erreur}</Alert>;
  if (!data) return <Box p={4} textAlign="center"><CircularProgress /></Box>;

  const d = data.declaration;
  const p = data.visite.personnel;
  const values = (d?.data ?? {}) as Record<string, unknown>;
  const ctx = contexteAes(d, data.referentiel, true);

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3, "@media print": { p: 0, "& .no-print": { display: "none" } } }}>
      <Box className="no-print" textAlign="right" mb={2}>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
          Imprimer
        </Button>
      </Box>

      <Typography variant="h5" fontWeight={700}>
        Accident d&apos;exposition au sang — compte rendu
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {p.lastName} {p.firstName} · PPR {p.matricule ?? "—"} · {p.poste?.libelle ?? ""} · {p.service?.libelle ?? ""} · Statut :{" "}
        {{ BROUILLON: "brouillon", VALIDEE: "validée", CLOTUREE: "clôturée" }[d?.statut ?? "BROUILLON"]} · Édité le{" "}
        {dayjs().format("DD/MM/YYYY")}
      </Typography>

      {DECLARATION_AES.filter((s) => sectionVisible(s, values, ctx)).map((s) => (
        <Box key={s.id} mb={2} sx={{ breakInside: "avoid" }}>
          <Typography variant="subtitle1" fontWeight={700}>{s.title}</Typography>
          <Lignes lignes={lignesSection(s, values, ctx)} />
        </Box>
      ))}

      {d && d.suivis.length > 0 && (
        <Box mb={2} sx={{ breakInside: "avoid" }}>
          <Typography variant="subtitle1" fontWeight={700}>10. Calendrier de suivi</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Visite</TableCell>
                <TableCell>Date prévue</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Bilans prévus</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {d.suivis.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{SUIVI_LIBELLES[s.code as SuiviCode]}</TableCell>
                  <TableCell>{dayjs(s.datePrevue).format("DD/MM/YYYY")}</TableCell>
                  <TableCell>{SUIVI_STATUT_LIBELLES[s.statut as SuiviStatut]}</TableCell>
                  <TableCell>{s.bilans.map((b) => BILAN_LIBELLES[b as Bilan] ?? b).join(", ") || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {d?.consultations.map((c) => (
        <Box key={c.id} mb={2} sx={{ breakInside: "avoid" }}>
          <Typography variant="subtitle1" fontWeight={700}>
            11. Consultation {SUIVI_LIBELLES[c.visite as SuiviCode] ?? c.visite} — {dayjs(c.dateConsultation).format("DD/MM/YYYY")}
          </Typography>
          <Lignes lignes={lignesSection(CONSULTATION_AES, (c.data ?? {}) as Record<string, unknown>, ctx)} />
        </Box>
      ))}

      {d?.motifArretSuivi && (
        <Typography variant="body2" mb={2}>
          <strong>Motif d&apos;arrêt du suivi :</strong> {d.motifArretSuivi}
        </Typography>
      )}

      <Divider sx={{ my: 3 }} />
      <Typography variant="h6" mb={2}>Aides de référence</Typography>
      {(["D", "F", "G"] as const).map((cle) => (
        <AnnexeTable key={cle} referentiel={data.referentiel} cle={cle} />
      ))}
    </Box>
  );
}
