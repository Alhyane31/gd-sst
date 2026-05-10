"use client";

import {
  Alert, Box, Button, Chip, CircularProgress,
  Dialog, DialogContent, DialogTitle,
  FormControlLabel, Checkbox, IconButton, MenuItem,
  Pagination, Paper, Stack, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import CloseIcon from "@mui/icons-material/Close";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useCallback, useEffect, useRef, useState } from "react";

type Cim11Item = {
  id: string;
  code: string;
  libelle: string;
  level: "L1" | "L2" | "L3" | "L4" | "L5";
  isLeaf: boolean;
  pathCodes: string[];
  parent?: { id: string; code: string; libelle: string } | null;
  _count?: { children: number; pathologies: number };
};

const LEVEL_COLOR: Record<string, "primary" | "secondary" | "info" | "warning" | "success" | "default"> = {
  L1: "primary", L2: "secondary", L3: "info", L4: "warning", L5: "success",
};

function flattenTree(
  data: Record<string, Cim11Item[]>,
  expanded: Set<string>,
  parentKey = "__root__",
  depth = 0
): { node: Cim11Item; depth: number }[] {
  const nodes = data[parentKey] ?? [];
  const rows: { node: Cim11Item; depth: number }[] = [];
  for (const node of nodes) {
    rows.push({ node, depth });
    if (expanded.has(node.id)) {
      rows.push(...flattenTree(data, expanded, node.id, depth + 1));
    }
  }
  return rows;
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (item: { code: string; libelle: string }) => void;
};

export default function Cim11PickerDialog({ open, onClose, onSelect }: Props) {
  const [treeData, setTreeData] = useState<Record<string, Cim11Item[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const loadingRef = useRef(new Set<string>());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [rootLoading, setRootLoading] = useState(false);

  const [flatItems, setFlatItems] = useState<Cim11Item[]>([]);
  const [flatTotal, setFlatTotal] = useState(0);
  const [flatPage, setFlatPage] = useState(1);
  const [flatTotalPages, setFlatTotalPages] = useState(1);
  const [flatLoading, setFlatLoading] = useState(false);

  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  const [isLeafOnly, setIsLeafOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"tree" | "flat">("tree");
  const [error, setError] = useState("");

  const loadRoot = useCallback(async () => {
    setRootLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cim11?parentId=__root__&pageSize=200");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTreeData((prev) => ({ ...prev, __root__: data.items ?? [] }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRootLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && !treeData["__root__"]) loadRoot();
  }, [open, loadRoot, treeData]);

  const loadChildren = useCallback(async (nodeId: string) => {
    if (loadingRef.current.has(nodeId)) return;
    loadingRef.current.add(nodeId);
    setLoadingIds(new Set(loadingRef.current));
    try {
      const res = await fetch(`/api/cim11?parentId=${nodeId}&pageSize=500`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTreeData((prev) => ({ ...prev, [nodeId]: data.items ?? [] }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      loadingRef.current.delete(nodeId);
      setLoadingIds(new Set(loadingRef.current));
    }
  }, []);

  const toggleExpand = useCallback(async (node: Cim11Item) => {
    if ((node._count?.children ?? 0) === 0) return;
    if (expanded.has(node.id)) {
      setExpanded((prev) => { const n = new Set(prev); n.delete(node.id); return n; });
    } else {
      if (!treeData[node.id]) await loadChildren(node.id);
      setExpanded((prev) => new Set(prev).add(node.id));
    }
  }, [expanded, treeData, loadChildren]);

  const fetchFlat = useCallback(async (p: number, qVal: string, lvl: string, leaf: boolean) => {
    setFlatLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (qVal) params.set("q", qVal);
      if (lvl) params.set("level", lvl);
      if (leaf) params.set("isLeaf", "true");
      params.set("page", String(p));
      params.set("pageSize", "25");
      const res = await fetch(`/api/cim11?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setFlatItems(data.items ?? []);
      setFlatTotal(data.total ?? 0);
      setFlatTotalPages(data.totalPages ?? 1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFlatLoading(false);
    }
  }, []);

  const handleSearch = () => {
    setFlatPage(1);
    setViewMode("flat");
    fetchFlat(1, q, level, isLeafOnly);
  };

  const handleReset = () => {
    setQ(""); setLevel(""); setIsLeafOnly(false);
    setFlatItems([]); setFlatTotal(0); setFlatPage(1);
    setViewMode("tree");
  };

  const handleSelect = (item: Cim11Item) => {
    if (!item.isLeaf) return;
    onSelect({ code: item.code, libelle: item.libelle });
    onClose();
  };

  const visibleRows = flattenTree(treeData, expanded);

  const renderActions = (item: Cim11Item) =>
    item.isLeaf ? (
      <Button
        size="small"
        variant="contained"
        color="success"
        startIcon={<CheckCircleIcon />}
        onClick={() => handleSelect(item)}
      >
        Sélectionner
      </Button>
    ) : (
      <Typography variant="body2" color="text.disabled">—</Typography>
    );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Référentiel CIM-11 — Sélectionner une pathologie</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Filtres */}
        <Paper sx={{ p: 2, mb: 2 }} elevation={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} flexWrap="wrap" alignItems="center">
            <TextField
              label="Rechercher code ou libellé"
              value={q}
              size="small"
              sx={{ flexGrow: 1, minWidth: 220 }}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <TextField
              select
              label="Niveau"
              value={level}
              size="small"
              sx={{ minWidth: 150 }}
              onChange={(e) => setLevel(e.target.value)}
            >
              <MenuItem value="">Tous les niveaux</MenuItem>
              <MenuItem value="L1">L1 — Catégories</MenuItem>
              <MenuItem value="L2">L2 — Blocs</MenuItem>
              <MenuItem value="L3">L3</MenuItem>
              <MenuItem value="L4">L4</MenuItem>
              <MenuItem value="L5">L5</MenuItem>
            </TextField>
            <FormControlLabel
              control={<Checkbox checked={isLeafOnly} size="small" onChange={(e) => setIsLeafOnly(e.target.checked)} />}
              label="Feuilles uniquement"
            />
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<SearchIcon />} size="small" onClick={handleSearch}>
                Rechercher
              </Button>
              <Button variant="outlined" color="secondary" startIcon={<ClearIcon />} size="small" onClick={handleReset}>
                Vider
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Vue toggle + stats */}
        <Stack direction="row" spacing={1} mb={2} alignItems="center">
          <Button
            variant={viewMode === "tree" ? "contained" : "outlined"}
            size="small"
            startIcon={<AccountTreeIcon />}
            onClick={() => setViewMode("tree")}
          >
            Arborescence
          </Button>
          <Button
            variant={viewMode === "flat" ? "contained" : "outlined"}
            size="small"
            startIcon={<FormatListBulletedIcon />}
            onClick={() => { setViewMode("flat"); fetchFlat(1, q, level, isLeafOnly); }}
          >
            Liste
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            {viewMode === "tree"
              ? `${treeData["__root__"]?.length ?? 0} catégories L1`
              : `${flatTotal} résultat${flatTotal !== 1 ? "s" : ""}`}
          </Typography>
        </Stack>

        {/* Table */}
        <Paper sx={{ overflow: "auto", maxHeight: 420 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: "background.default" }}>
                <TableCell sx={{ minWidth: 180 }}>Code</TableCell>
                <TableCell>Libellé</TableCell>
                {viewMode === "flat" && <TableCell sx={{ minWidth: 160 }}>Chemin</TableCell>}
                <TableCell sx={{ width: 70 }}>Niveau</TableCell>
                <TableCell sx={{ width: 80 }}>Type</TableCell>
                <TableCell align="right" sx={{ width: 130 }}>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {/* TREE */}
              {viewMode === "tree" && (
                rootLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={20} sx={{ mr: 1 }} />Chargement...
                    </TableCell>
                  </TableRow>
                ) : visibleRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>Aucune donnée</TableCell>
                  </TableRow>
                ) : (
                  visibleRows.map(({ node, depth }) => {
                    const hasChildren = (node._count?.children ?? 0) > 0;
                    const isExpanded = expanded.has(node.id);
                    const isLoading = loadingIds.has(node.id);
                    return (
                      <TableRow key={node.id} hover>
                        <TableCell sx={{ pl: depth * 3.5 + 1 }}>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            {hasChildren ? (
                              <Tooltip title={isExpanded ? "Réduire" : "Développer"}>
                                <IconButton size="small" onClick={() => toggleExpand(node)} sx={{ p: 0.25 }}>
                                  {isLoading
                                    ? <CircularProgress size={14} />
                                    : isExpanded
                                    ? <ExpandMoreIcon sx={{ fontSize: 18 }} />
                                    : <ChevronRightIcon sx={{ fontSize: 18 }} />}
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Box sx={{ width: 28 }} />
                            )}
                            <Chip
                              label={node.code}
                              size="small"
                              color={LEVEL_COLOR[node.level]}
                              variant="outlined"
                              sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.72rem" }}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: depth === 0 ? 600 : depth === 1 ? 500 : 400, color: depth === 0 ? "text.primary" : "text.secondary" }}
                          >
                            {node.libelle}
                          </Typography>
                        </TableCell>
                        <TableCell><Chip label={node.level} size="small" color={LEVEL_COLOR[node.level]} /></TableCell>
                        <TableCell>
                          {node.isLeaf
                            ? <Chip label="Feuille" size="small" color="success" />
                            : <Chip label="Groupe" size="small" variant="outlined" />}
                        </TableCell>
                        <TableCell align="right">{renderActions(node)}</TableCell>
                      </TableRow>
                    );
                  })
                )
              )}

              {/* FLAT */}
              {viewMode === "flat" && (
                flatLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={20} sx={{ mr: 1 }} />Chargement...
                    </TableCell>
                  </TableRow>
                ) : flatItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>Aucun résultat</TableCell>
                  </TableRow>
                ) : (
                  flatItems.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Chip
                          label={item.code}
                          size="small"
                          color={LEVEL_COLOR[item.level]}
                          variant="outlined"
                          sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.72rem" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: item.level === "L1" ? 600 : 400 }}>
                          {item.libelle}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                          {Array.isArray(item.pathCodes) && item.pathCodes.length > 1
                            ? item.pathCodes.slice(0, -1).join(" › ")
                            : item.parent?.code ?? "—"}
                        </Typography>
                      </TableCell>
                      <TableCell><Chip label={item.level} size="small" color={LEVEL_COLOR[item.level]} /></TableCell>
                      <TableCell>
                        {item.isLeaf
                          ? <Chip label="Feuille" size="small" color="success" />
                          : <Chip label="Groupe" size="small" variant="outlined" />}
                      </TableCell>
                      <TableCell align="right">{renderActions(item)}</TableCell>
                    </TableRow>
                  ))
                )
              )}
            </TableBody>
          </Table>
        </Paper>

        {/* Pagination */}
        {viewMode === "flat" && flatTotalPages > 1 && (
          <Box mt={2} display="flex" justifyContent="center">
            <Pagination
              page={flatPage}
              count={flatTotalPages}
              onChange={(_, value) => {
                setFlatPage(value);
                fetchFlat(value, q, level, isLeafOnly);
              }}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
