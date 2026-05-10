"use client";

import { Box, Alert } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PersonnelFormStepper from "@/app/formulaires/components/PersonnelFormStepper";
import type { FormData } from "@/app/formulaires/components/types";
import { mapApiToFormData, emptyData } from "../../mapper";

const VISITE_LABELS: Record<string, string> = {
  ANNUELLE: "Visite annuelle",
  RAPPROCHEE: "Visite rapprochée",
  SPONTANNE: "Visite spontanée",
  CM: "Conseil médical",
  EXPERTISE: "Expertise",
  ETUDEP: "Étude de poste",
  LD: "Longue durée",
  MD: "Mi-durée",
  AUTRE: "Autre visite",
};

function generateMatricule(nom: string, prenom: string): string {
  const prefix = (nom[0] ?? "X").toUpperCase() + (prenom[0] ?? "X").toUpperCase();
  const digits = String(Math.floor(10000 + Math.random() * 90000));
  return prefix + digits;
}


export default function VisiteEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray((params as any).id) ? (params as any).id[0] : (params as any).id;

  const [formulaireStatut, setFormulaireStatut] = useState<"DRAFT" | "SUBMITTED" | "VERIFIED" | "">("");
  const [visiteStatut, setVisiteStatut] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<FormData>(emptyData);
  const [categoriePersonnel, setCategoriePersonnel] = useState<string>("VP");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/visites/${id}/formulaire`);
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.message ?? "Erreur chargement");

        const mapped = mapApiToFormData(payload);
        if (!mapped.matricule && mapped.nom) {
          mapped.matricule = generateMatricule(mapped.nom, mapped.prenom);
        }
        setData(mapped);
        setFormulaireStatut(payload?.formulaire?.statut ?? "");
        setVisiteStatut(payload?.visite?.statut ?? "");
        setCategoriePersonnel(payload?.personnel?.categorie ?? "VP");
      } catch (e: any) {
        setError(e?.message ?? "Erreur");
      } finally {
        setLoading(false);
      }
    };

    if (id) run();
  }, [id]);

  const callPut = async (formData: FormData) => {
    const res = await fetch(`/api/visites/${id}/formulaire`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload?.message ?? "Échec de l'enregistrement");
    setFormulaireStatut(payload?.statut ?? formulaireStatut);
  };

  const handleSave = async (formData: FormData) => {
    setSaving(true);
    setError("");
    try {
      await callPut(formData);
    } catch (e: any) {
      setError(e?.message ?? "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    setError("");
    try {
      await callPut(formData);
      router.push(`/visites/${id}`);
    } catch (e: any) {
      setError(e?.message ?? "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box p={4}>Chargement...</Box>;

  const isClosed = visiteStatut === "CLOTUREE";

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {error && (
        <Box px={2} pt={2}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <PersonnelFormStepper
        mode="edit"
        readOnly={isClosed}
        title={`${VISITE_LABELS[data.typeVisite ?? ""] ?? "Visite"} — ${data.nom} ${data.prenom}`.trim()}
        initialData={data}
        saving={saving}
        categoriePersonnel={categoriePersonnel}
        onSave={handleSave}
        onSubmit={handleSubmit}
      />
    </Box>
  );
}
