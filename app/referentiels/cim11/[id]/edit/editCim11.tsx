"use client";

import { Alert, Box, Paper, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cim11Form, { Cim11FormValues } from "../../Cim11Form";

const emptyValues: Cim11FormValues = {
  code: "",
  libelle: "",
  level: "",
  parentId: "",
  isLeaf: false,
  pathCodesText: "",
};

export default function EditCim11Page() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [parentOptions, setParentOptions] = useState<any[]>([]);
  const [values, setValues] = useState<Cim11FormValues>(emptyValues);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError("");

        const [itemRes, parentsRes] = await Promise.all([
          fetch(`/api/cim11/${id}`),
          fetch("/api/cim11?pageSize=500"),
        ]);

        const itemPayload = await itemRes.json().catch(() => ({}));
        const parentsPayload = await parentsRes.json().catch(() => ({}));

        if (!itemRes.ok) {
          throw new Error(itemPayload?.message ?? "Erreur chargement");
        }

        setParentOptions((parentsPayload.items ?? []).filter((x: any) => x.id !== id));

        setValues({
          code: itemPayload.code ?? "",
          libelle: itemPayload.libelle ?? "",
          level: itemPayload.level ?? "",
          parentId: itemPayload.parentId ?? "",
          isLeaf: Boolean(itemPayload.isLeaf),
          pathCodesText: Array.isArray(itemPayload.pathCodes)
            ? itemPayload.pathCodes.join(", ")
            : "",
        });
      } catch (e: any) {
        setError(e?.message ?? "Erreur");
      } finally {
        setLoading(false);
      }
    };

    if (id) run();
  }, [id]);

  const handleSubmit = async (formValues: Cim11FormValues) => {
    try {
      setSaving(true);
      setError("");

      const res = await fetch(`/api/cim11/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formValues.code,
          libelle: formValues.libelle,
          level: formValues.level,
          parentId: formValues.parentId || null,
          isLeaf: formValues.isLeaf,
          pathCodes: formValues.pathCodesText
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message ?? "Erreur mise à jour");

      router.push("/referentiels/cim11");
    } catch (e: any) {
      setError(e?.message ?? "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box p={4}>Chargement...</Box>;

  return (
    <Box p={4}>
      <Typography variant="h4" mb={3}>
        Éditer un nœud CIM-11
      </Typography>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Paper sx={{ p: 3 }}>
        <Cim11Form
          initialValues={values}
          saving={saving}
          parentOptions={parentOptions}
          onSubmit={handleSubmit}
        />
      </Paper>
    </Box>
  );
}