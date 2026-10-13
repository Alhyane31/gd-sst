"use client";

// Déclaration AES (sections 1 à 9) : les sections partagent les mêmes réponses.
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import { useEffect, useMemo, useState } from "react";
import SectionRenderer from "@/app/formulaires/examen/components/SectionRenderer";
import type { SectionValues } from "@/app/formulaires/examen/types";
import { contexteAes } from "@/lib/aes/contexte";
import type { ReferentielAes } from "@/lib/aes/referentiel";
import { DECLARATION_AES, sectionVisible } from "../config/declaration";
import type { DeclarationApi } from "../types";
import { libellesManquants, manquantsDeclaration, type Manquants } from "../validation";

export default function DeclarationForm({
  visiteId,
  declaration,
  referentiel,
  onSaved,
  onAide,
}: {
  visiteId: string;
  declaration: DeclarationApi | null;
  referentiel: ReferentielAes;
  onSaved: (d: DeclarationApi) => void;
  /** ouvre une annexe (liens « Voir l'annexe ») */
  onAide?: (cle: string) => void;
}) {
  const [values, setValues] = useState<SectionValues>((declaration?.data as SectionValues) ?? {});
  const [manquants, setManquants] = useState<Manquants>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ severite: "success" | "error"; texte: string } | null>(null);

  // rechargé seulement si les réponses enregistrées changent (pas après un enregistrement du calendrier)
  const dataEnregistree = JSON.stringify(declaration?.data ?? {});
  useEffect(() => setValues(JSON.parse(dataEnregistree)), [dataEnregistree]);

  const statut = declaration?.statut ?? "BROUILLON";
  const readOnly = statut === "CLOTUREE";
  const ctx = useMemo(() => ({ ...contexteAes(declaration, referentiel, readOnly), onAide }), [declaration, referentiel, readOnly, onAide]);

  const enregistrer = async (action: "brouillon" | "valider") => {
    setMessage(null);
    // contrôle immédiat des obligatoires (le serveur refait la même validation)
    if (action === "valider" || statut === "VALIDEE") {
      const m = manquantsDeclaration(values, ctx);
      setManquants(m);
      if (Object.keys(m).length) {
        setMessage({ severite: "error", texte: `Champs obligatoires manquants : ${libellesManquants(m).join(", ")}` });
        return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/aes/${visiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: values, action }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (payload?.manquants) setManquants(payload.manquants);
        throw new Error(payload?.message ?? "Erreur lors de l'enregistrement");
      }
      setManquants({});
      onSaved(payload.declaration);
      setMessage({
        severite: "success",
        texte: action === "valider" && statut === "BROUILLON" ? "Déclaration validée : le calendrier de suivi a été généré." : "Enregistré.",
      });
    } catch (e: unknown) {
      setMessage({ severite: "error", texte: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setSaving(false);
    }
  };

  const sections = DECLARATION_AES.filter((s) => sectionVisible(s, values, ctx));

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" mb={2} flexWrap="wrap" useFlexGap>
        <Chip
          label={{ BROUILLON: "Brouillon", VALIDEE: "Validée", CLOTUREE: "Clôturée" }[statut]}
          color={statut === "VALIDEE" ? "success" : statut === "CLOTUREE" ? "default" : "warning"}
        />
        <Typography variant="body2" color="text.secondary">
          Les champs marqués * sont obligatoires pour valider. Une déclaration validée reste modifiable (ex. statut de la source) jusqu&apos;à
          la clôture.
        </Typography>
      </Stack>

      {sections.map((s) => (
        <Paper key={s.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" mb={1}>
            {s.title}
          </Typography>
          <SectionRenderer section={s} values={values} onChange={setValues} ctx={ctx} champPrefix="aes" missing={manquants[s.id]} />
        </Paper>
      ))}

      {message && (
        <Alert severity={message.severite} sx={{ mb: 2 }}>
          {message.texte}
        </Alert>
      )}

      {!readOnly && (
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ position: "sticky", bottom: 0, bgcolor: "background.paper", py: 1 }}>
          {statut === "BROUILLON" && (
            <Button variant="outlined" startIcon={<SaveIcon />} disabled={saving} onClick={() => enregistrer("brouillon")}>
              Enregistrer le brouillon
            </Button>
          )}
          <Button variant="contained" startIcon={<TaskAltIcon />} disabled={saving} onClick={() => enregistrer("valider")}>
            {statut === "BROUILLON" ? "Valider la déclaration" : "Enregistrer"}
          </Button>
        </Stack>
      )}
    </Box>
  );
}
