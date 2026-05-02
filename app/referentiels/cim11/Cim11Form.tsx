"use client";

import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";

export type Cim11FormValues = {
  code: string;
  libelle: string;
  level: "L1" | "L2" | "L3" | "L4" | "L5" | "";
  parentId: string;
  isLeaf: boolean;
  pathCodesText: string;
};

type ParentOption = {
  id: string;
  code: string;
  libelle: string;
};

type Props = {
  initialValues: Cim11FormValues;
  saving?: boolean;
  parentOptions: ParentOption[];
  onSubmit: (values: Cim11FormValues) => Promise<void> | void;
};

export default function Cim11Form({
  initialValues,
  saving = false,
  parentOptions,
  onSubmit,
}: Props) {
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  return (
    <Box component="form" onSubmit={(e) => {
      e.preventDefault();
      onSubmit(values);
    }}>
      <Stack spacing={2}>
        <TextField
          label="Code"
          value={values.code}
          onChange={(e) => setValues((p) => ({ ...p, code: e.target.value }))}
          required
        />

        <TextField
          label="Libellé"
          value={values.libelle}
          onChange={(e) => setValues((p) => ({ ...p, libelle: e.target.value }))}
          required
        />

        <TextField
          select
          label="Niveau"
          value={values.level}
          onChange={(e) => setValues((p) => ({ ...p, level: e.target.value as any }))}
          required
        >
          <MenuItem value="L1">L1</MenuItem>
          <MenuItem value="L2">L2</MenuItem>
          <MenuItem value="L3">L3</MenuItem>
          <MenuItem value="L4">L4</MenuItem>
          <MenuItem value="L5">L5</MenuItem>
        </TextField>

        <TextField
          select
          label="Parent"
          value={values.parentId}
          onChange={(e) => setValues((p) => ({ ...p, parentId: e.target.value }))}
        >
          <MenuItem value="">Aucun</MenuItem>
          {parentOptions.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.code} — {p.libelle}
            </MenuItem>
          ))}
        </TextField>

        <FormControlLabel
          control={
            <Checkbox
              checked={values.isLeaf}
              onChange={(e) =>
                setValues((p) => ({ ...p, isLeaf: e.target.checked }))
              }
            />
          }
          label="Feuille"
        />

        <TextField
          label="Path codes"
          helperText='Séparer par virgule. Ex: Niveau1-2, BlockL1-2A0, 2A00, 2A00.1'
          value={values.pathCodesText}
          onChange={(e) =>
            setValues((p) => ({ ...p, pathCodesText: e.target.value }))
          }
          multiline
          minRows={2}
        />

        <Box display="flex" justifyContent="flex-end">
          <Button type="submit" variant="contained" disabled={saving}>
            Enregistrer
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}