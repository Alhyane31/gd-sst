"use client";

import { Alert, Box, Paper, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cim11Form, { Cim11FormValues } from "../Cim11Form";

const emptyValues: Cim11FormValues = {
  code: "",
  libelle: "",
  level: "",
  parentId: "",
  isLeaf: false,
  pathCodesText: "",
};

export default function NewCim11Page() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [parentOptions, setParentOptions] = useState<any[]>([]);

  useEffect(() => {
    const loadParents = async () => {
      const res = await fetch("/api/cim11?pageSize=500");
      const payload = await res.json().catch(() => ({}));
      if (res.ok) setParentOptions(payload.items ?? []);
    };
    loadParents();
  }, []);

  const handleSubmit = async (values: Cim11FormValues) => {
    try {
      setSaving(true);
      setError("");

      const res = await fetch("/api/cim11", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: values.code,
          libelle: values.libelle,
          level: values.level,
          parentId: values.parentId || null,
          isLeaf: values.isLeaf,
          pathCodes: values.pathCodesText
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message ?? "Erreur création");

      router.push("/referentiels/cim11");
    } catch (e: any) {
      setError(e?.message ?? "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h4" mb={3}>
        Nouveau nœud CIM-11
      </Typography>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Paper sx={{ p: 3 }}>
        <Cim11Form
          initialValues={emptyValues}
          saving={saving}
          parentOptions={parentOptions}
          onSubmit={handleSubmit}
        />
      </Paper>
    </Box>
  );
}