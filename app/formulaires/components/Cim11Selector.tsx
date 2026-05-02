"use client";

import {
  Box,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useEffect, useState } from "react";

type Cim11Node = {
  id: string;
  code: string;
  libelle: string;
  isLeaf: boolean;
};

export default function Cim11Selector({
  onSelect,
}: {
  onSelect: (node: Cim11Node) => void;
}) {
  const [nodes, setNodes] = useState<Cim11Node[]>([]);
  const [loading, setLoading] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<Cim11Node[]>([]);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/cim11?parentId=${parentId ?? ""}&search=${search}`
      );
      const data = await res.json();
setNodes(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [parentId, search]);

  const handleClick = (node: Cim11Node) => {
    if (node.isLeaf) {
      onSelect(node); // ✅ sélection finale
    } else {
      setBreadcrumb((prev) => [...prev, node]);
      setParentId(node.id);
    }
  };

  const goBack = (index: number) => {
    const newPath = breadcrumb.slice(0, index + 1);
    setBreadcrumb(newPath);
    setParentId(newPath[newPath.length - 1]?.id ?? null);
  };

  return (
    <Box>
      {/* 🔎 Recherche */}
      <TextField
        fullWidth
        size="small"
        placeholder="Rechercher une pathologie CIM-11..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* 🧭 Breadcrumb */}
      <Box mb={2} display="flex" gap={1} flexWrap="wrap">
        <Chip label="Racine" onClick={() => {
          setBreadcrumb([]);
          setParentId(null);
        }} />

        {breadcrumb.map((b, i) => (
          <Chip
            key={b.id}
            label={`${b.code}`}
            onClick={() => goBack(i)}
          />
        ))}
      </Box>

      {/* 📋 Liste */}
      {loading ? (
        <CircularProgress size={20} />
      ) : (
        <List dense>
          {nodes.length === 0 ? (
            <Typography variant="body2">
              Aucun résultat
            </Typography>
          ) : (
            nodes.map((node) => (
              <ListItemButton
                key={node.id}
                onClick={() => handleClick(node)}
              >
                <ListItemText
                  primary={`${node.code} — ${node.libelle}`}
                  secondary={!node.isLeaf ? "➡️ Sous-catégories" : "✔️ Sélectionnable"}
                />
              </ListItemButton>
            ))
          )}
        </List>
      )}
    </Box>
  );
}