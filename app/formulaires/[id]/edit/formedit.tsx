"use client";

import { Box, Alert } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PersonnelFormStepper from "@/app/formulaires/components/PersonnelFormStepper";
import type { FormData } from "@/app/formulaires/components/types";
import { mapApiToFormData } from "../../mapper";
const emptyData: FormData = {
  nom: "",
  prenom: "",
  dateNaissance: "",
  statutSocial: "",
  matricule: "",

  formation: "",
  service: "",
  dateAffectationChu: "",
  autreEtablissement: "non",
  lieuTravail: "",
  dureeAnnees: "",
  horaires: "",

  travailGarde: "non",
  heuresGarde: "",
  rythmeGarde: "",

  travailNuit: "non",
  nbNuitsMois: "",
  horairesNuit: "",

  pathologiesHistory: [],
  pathologiesToAdd: [],
  antecedents: "",
};

export default function VisiteEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray((params as any).id) ? (params as any).id[0] : (params as any).id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<FormData>(emptyData);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        // 🔧 API à créer: renvoyer { formData } prêt pour le stepper
        const res = await fetch(`/api/visites/${id}/formulaire`);
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.message ?? "Erreur chargement");

        setData(mapApiToFormData(payload));
      } catch (e: any) {
        setError(e?.message ?? "Erreur");
      } finally {
        setLoading(false);
      }
    };
    if (id) run();
  }, [id]);

  const handleSave = async (formData: FormData) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/visites/${id}/formulaire`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message ?? "Échec de l'enregistrement");

      // option: toast + revenir à la vue visite
      router.push(`/visites/${id}`);
    } catch (e: any) {
      setError(e?.message ?? "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box p={4}>Chargement...</Box>;

  return (
    <Box>
      {error ? (
        <Box p={4}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : null}

      <PersonnelFormStepper
        mode="edit"
        title="Éditer le formulaire de visite"
        initialData={data}
        saving={saving}
         onSubmit={async () => {}}
      />
    </Box>
  );
}