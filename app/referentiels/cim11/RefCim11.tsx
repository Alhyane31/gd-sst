"use client";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";

type Cim11Item = {
  id: string;
  code: string;
  libelle: string;
  level: "L1" | "L2" | "L3" | "L4" | "L5";
  isLeaf: boolean;
  parent?: { id: string; code: string; libelle: string } | null;
  _count?: { children: number; pathologies: number };
};

export default function Cim11ListPage() {
  const [items, setItems] = useState<Cim11Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  const [isLeafOnly, setIsLeafOnly] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (level) params.set("level", level);
      if (isLeafOnly) params.set("isLeaf", "true");
      params.set("page", String(page));
      params.set("pageSize", "20");

      const res = await fetch(`/api/cim11?${params.toString()}`);
      const payload = await res.json();

      if (!res.ok) throw new Error(payload?.message ?? "Erreur chargement");

      setItems(payload.items ?? []);
      setTotalPages(payload.totalPages ?? 1);
    } catch (e: any) {
      setError(e?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const handleSearch = async () => {
    setPage(1);
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet élément ?")) return;

    try {
      const res = await fetch(`/api/cim11/${id}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message ?? "Erreur suppression");
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Erreur");
    }
  };

  return (
    <Box p={4}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Référentiel CIM-11</Typography>
        <Button
          component={Link}
          href="/referentiels/cim11/new"
          variant="contained"
        >
          Nouveau nœud
        </Button>
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Recherche code ou libellé"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            fullWidth
          />

          <TextField
            select
            label="Niveau"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="L1">L1</MenuItem>
            <MenuItem value="L2">L2</MenuItem>
            <MenuItem value="L3">L3</MenuItem>
            <MenuItem value="L4">L4</MenuItem>
            <MenuItem value="L5">L5</MenuItem>
          </TextField>

          <FormControlLabel
            control={
              <Checkbox
                checked={isLeafOnly}
                onChange={(e) => setIsLeafOnly(e.target.checked)}
              />
            }
            label="Feuilles seulement"
          />

          <Button variant="contained" onClick={handleSearch}>
            Rechercher
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ overflow: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Libellé</TableCell>
              <TableCell>Niveau</TableCell>
              <TableCell>Parent</TableCell>
              <TableCell>Feuille</TableCell>
              <TableCell>Enfants</TableCell>
              <TableCell>Utilisations</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  {loading ? "Chargement..." : "Aucun résultat"}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.libelle}</TableCell>
                  <TableCell>{item.level}</TableCell>
                  <TableCell>
                    {item.parent ? `${item.parent.code} — ${item.parent.libelle}` : "—"}
                  </TableCell>
                  <TableCell>{item.isLeaf ? "Oui" : "Non"}</TableCell>
                  <TableCell>{item._count?.children ?? 0}</TableCell>
                  <TableCell>{item._count?.pathologies ?? 0}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        component={Link}
                        href={`/referentiels/cim11/${item.id}/edit`}
                        size="small"
                      >
                        Éditer
                      </Button>
                      <Button
                        color="error"
                        size="small"
                        onClick={() => handleDelete(item.id)}
                      >
                        Supprimer
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      <Box mt={2} display="flex" justifyContent="center">
        <Pagination
          page={page}
          count={totalPages}
          onChange={(_, value) => setPage(value)}
        />
      </Box>
    </Box>
  );
}