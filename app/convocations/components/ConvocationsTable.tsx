"use client";

import {
  Box,
  Checkbox,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Button,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Cancel";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConvocationRow } from "../types";

function fmtDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const STATUT_LABELS: Record<string, string> = {
  A_CONVOQUER: "À convoquer",
  CONVOCATION_GENEREE: "Convocation générée",
  A_TRAITER: "À traiter",
  A_RELANCER: "À relancer",
  RELANCEE: "Relancée",
  REALISEE: "Réalisée",
  ANNULEE: "Annulée",
  ENVOYEE: "Envoyée",
};

const CONVOCATION_TYPE_LABELS: Record<string, string> = {
  INITIALE: "Initiale",
  RELANCE_1: "Relance 1",
  RELANCE_2: "Relance 2",
  RELANCE_3: "Relance 3",
};

interface Props {
  rows: ConvocationRow[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (field: string, order: "asc" | "desc") => void;
  selectedIds: string[];
  onToggleOne: (id: string) => void;
  onToggleAll: () => void;
  onClearSelection: () => void;
  onBulkCancel: () => void;
  bulkCanceling?: boolean;
}

export default function ConvocationsTable({
  rows,
  sortBy,
  sortOrder,
  onSortChange,
  selectedIds,
  onToggleOne,
  onToggleAll,
  onClearSelection,
  onBulkCancel,
  bulkCanceling,
}: Props) {
  const router = useRouter();
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const handleSort = (field: string) => {
    if (field === sortBy) {
      onSortChange(field, sortOrder === "asc" ? "desc" : "asc");
    } else {
      onSortChange(field, "asc");
    }
  };

  const col = (field: string, label: string) => (
    <TableCell sortDirection={sortBy === field ? sortOrder : false}>
      <TableSortLabel
        active={sortBy === field}
        direction={sortBy === field ? sortOrder : "asc"}
        onClick={() => handleSort(field)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  const handleCancel = async (id: string) => {
    const ok = confirm("Annuler cette convocation ?");
    if (!ok) return;

    setCancelingId(id);
    try {
      const res = await fetch(`/api/convocations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "ANNULEE" }),
      });

      if (!res.ok) {
        alert("Erreur lors de l'annulation");
        return;
      }

      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Erreur réseau");
    } finally {
      setCancelingId(null);
    }
  };

  const allOnPageSelected =
    rows.length > 0 && rows.every((r) => selectedIds.includes(r.id));
  const someOnPageSelected =
    rows.some((r) => selectedIds.includes(r.id)) && !allOnPageSelected;

  return (
    <Box>
      {/* Top bar: Nouvelle convocation + bulk actions */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2 }}>
        {selectedIds.length > 0 ? (
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              {selectedIds.length} sélectionnée(s)
            </Typography>
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<CancelIcon />}
              onClick={onBulkCancel}
              disabled={bulkCanceling}
            >
              {bulkCanceling ? "Annulation..." : "Annuler la sélection"}
            </Button>
            <Button size="small" variant="outlined" onClick={onClearSelection}>
              Désélectionner tout
            </Button>
          </Stack>
        ) : (
          <Box />
        )}

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push("/convocations/new")}
          sx={{ height: 36, minWidth: 220 }}
        >
          Nouvelle convocation
        </Button>
      </Stack>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={allOnPageSelected}
                indeterminate={someOnPageSelected}
                onChange={onToggleAll}
              />
            </TableCell>
            {col("personnel", "Personnel")}
            {col("poste", "Poste")}
            {col("service", "Service")}
            {col("formation", "Formation")}
            {col("categorie", "Catégorie")}
            {col("statut", "Statut")}
            {col("convocationType", "Convocation")}
            {col("dateConvocation", "Date convocation")}
            {col("datePrevue", "Date visite (prévue)")}
            {col("dateVisiteRealisee", "Date visite (réalisée)")}
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((v) => {
            const p = v.personnel;
            const isAConvoquer = v.statut === "A_CONVOQUER";

            return (
              <TableRow key={v.id} selected={selectedIds.includes(v.id)}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.includes(v.id)}
                    onChange={() => onToggleOne(v.id)}
                  />
                </TableCell>
                <TableCell>{`${p.lastName} ${p.firstName}`}</TableCell>
                <TableCell>{p.poste?.libelle}</TableCell>
                <TableCell>{p.service?.libelle}</TableCell>
                <TableCell>{p.formation?.libelle}</TableCell>

                <TableCell>
                  <Chip
                    size="small"
                    label={p.categorie === "SMR" ? "SMR" : "VP"}
                    color={p.categorie === "SMR" ? "warning" : "default"}
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    size="small"
                    label={STATUT_LABELS[v.statut] ?? v.statut}
                    color={isAConvoquer ? "success" : v.statut === "ANNULEE" ? "default" : "info"}
                    variant={isAConvoquer ? "filled" : "outlined"}
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={CONVOCATION_TYPE_LABELS[v.convocationType] ?? v.convocationType}
                  />
                </TableCell>

                <TableCell>{fmtDate(v.dateConvocation)}</TableCell>
                <TableCell>{formatDateTime(v.datePrevue)}</TableCell>
                <TableCell>{v.visite?.dateDebut ? formatDateTime(v.visite.dateDebut) : "-"}</TableCell>

                <TableCell align="center">
                  <IconButton color="primary" onClick={() => router.push(`/convocations/${v.id}`)}>
                    <VisibilityIcon />
                  </IconButton>

                  <IconButton color="warning" onClick={() => router.push(`/convocations/${v.id}/edit`)}>
                    <EditIcon />
                  </IconButton>

                  {isAConvoquer ? (
                    <Tooltip title="Annuler">
                      <span>
                        <IconButton
                          color="error"
                          onClick={() => handleCancel(v.id)}
                          disabled={cancelingId === v.id}
                        >
                          <BlockIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Annulation non disponible">
                      <span>
                        <IconButton color="error" disabled>
                          <BlockIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}
