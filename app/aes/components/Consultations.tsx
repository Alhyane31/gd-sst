"use client";

// Section 11 : consultations de résultats, répétables (une par visite du calendrier ou non programmée).
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import SectionRenderer from "@/app/formulaires/examen/components/SectionRenderer";
import type { SectionValues } from "@/app/formulaires/examen/types";
import { BILAN_LIBELLES, SUIVI_LIBELLES, type Bilan, type SuiviCode } from "@/lib/aes/codes";
import { contexteAes } from "@/lib/aes/contexte";
import type { ReferentielAes } from "@/lib/aes/referentiel";
import { alertesConsultation, resultatsPositifs } from "@/lib/aes/suivi";
import { CONSULTATION_AES } from "../config/consultation";
import type { DeclarationApi } from "../types";
import { libellesManquants, manquantsConsultation } from "../validation";

type Edition = { id?: string; values: SectionValues } | null;

export default function Consultations({
  visiteId,
  declaration,
  referentiel,
  onSaved,
}: {
  visiteId: string;
  declaration: DeclarationApi | null;
  referentiel: ReferentielAes;
  onSaved: (d: DeclarationApi) => void;
}) {
  const [edition, setEdition] = useState<Edition>(null);
  const [manquants, setManquants] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState("");

  const readOnly = declaration?.statut === "CLOTUREE";
  const ctx = useMemo(() => contexteAes(declaration, referentiel, readOnly), [declaration, referentiel, readOnly]);

  if (!declaration || declaration.statut === "BROUILLON") {
    return <Alert severity="info">Les consultations de résultats sont disponibles après validation de la déclaration.</Alert>;
  }

  const atFaite = !!ctx.extra?.atFaite;

  const enregistrer = async () => {
    if (!edition) return;
    setErreur("");
    const m = manquantsConsultation(edition.values, ctx);
    setManquants(m);
    if (m.length) {
      setErreur(`Champs obligatoires manquants : ${libellesManquants(m).join(", ")}`);
      return;
    }
    setSaving(true);
    try {
      const url = edition.id ? `/api/aes/${visiteId}/consultations/${edition.id}` : `/api/aes/${visiteId}/consultations`;
      const res = await fetch(url, {
        method: edition.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: edition.values }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (payload?.manquants) setManquants(payload.manquants);
        throw new Error(payload?.message ?? "Erreur lors de l'enregistrement");
      }
      onSaved(payload.declaration);
      setEdition(null);
      setManquants([]);
    } catch (e: unknown) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      {!atFaite && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Rappel : la déclaration en accident du travail n&apos;est pas faite. Elle est demandée à chaque visite jusqu&apos;à la clôture.
        </Alert>
      )}

      {declaration.consultations.length === 0 && !edition && (
        <Typography variant="body2" color="text.secondary" mb={2}>
          Aucune consultation de résultats enregistrée.
        </Typography>
      )}

      <Stack spacing={1.5} mb={2}>
        {declaration.consultations.map((c) => {
          const data = (c.data ?? {}) as SectionValues;
          const positifs = resultatsPositifs(data);
          const alertes = alertesConsultation(data, { atFaite: true }).filter((a) => a.severite === "error");
          return (
            <Paper key={c.id} variant="outlined" sx={{ p: 1.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Chip size="small" color="primary" label={SUIVI_LIBELLES[c.visite as SuiviCode] ?? c.visite} />
                  <Typography fontWeight={600}>{dayjs(c.dateConsultation).format("DD/MM/YYYY")}</Typography>
                  {positifs.length > 0 && (
                    <Chip size="small" color="error" label={`Positif : ${positifs.map((b) => BILAN_LIBELLES[b as Bilan] ?? b).join(", ")}`} />
                  )}
                  {alertes.length > 0 && positifs.length === 0 && <Chip size="small" color="error" label="Alerte" />}
                  {typeof data.prochaineConsultation === "string" && (
                    <Typography variant="body2" color="text.secondary">
                      Prochaine : {dayjs(data.prochaineConsultation).format("DD/MM/YYYY")}
                    </Typography>
                  )}
                </Stack>
                {!readOnly && (
                  <Button size="small" startIcon={<EditIcon />} onClick={() => setEdition({ id: c.id, values: data })}>
                    Modifier
                  </Button>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Stack>

      {edition ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" mb={1}>
            {edition.id ? "Modifier la consultation" : "Nouvelle consultation de résultats"}
          </Typography>
          <SectionRenderer
            section={CONSULTATION_AES}
            values={edition.values}
            onChange={(values) => setEdition((e) => (e ? { ...e, values } : e))}
            ctx={ctx}
            champPrefix="aes"
            missing={manquants}
          />
          {erreur && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {erreur}
            </Alert>
          )}
          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
            <Button onClick={() => { setEdition(null); setManquants([]); setErreur(""); }}>Annuler</Button>
            <Button variant="contained" startIcon={<SaveIcon />} disabled={saving} onClick={enregistrer}>
              Enregistrer la consultation
            </Button>
          </Stack>
        </Paper>
      ) : (
        !readOnly && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEdition({ values: {} })}>
            Ajouter une consultation
          </Button>
        )
      )}
    </Box>
  );
}
