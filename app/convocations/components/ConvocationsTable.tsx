"use client";

import {
  Box,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Stack,
  Tooltip,
} from "@mui/material";

import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import AddIcon from "@mui/icons-material/Add";

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

  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};
const STATUT_LABELS: Record<string, string> = {
  A_CONVOQUER: "À convoquer",
  CONVOCATION_GENEREE: "Convocation générée",
  A_TRAITER: "À traiter",
  A_RELANCER: "À relancer",
  RELANCEE: "Relancée",
  REALISEE: "Réalisée",
  ANNULEE: "Annulée",
};

const CONVOCATION_TYPE_LABELS: Record<string, string> = {
  INITIALE: "Initiale",
  RELANCE_1: "Relance 1",
  RELANCE_2: "Relance 2",
  RELANCE_3: "Relance 3",
};

export default function ConvocationsTable({ rows }: { rows: ConvocationRow[] }) {
  const router = useRouter();
  const [cancelingId, setCancelingId] = useState<string | null>(null);

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
        alert("Erreur lors de l’annulation");
        return;
      }

      // refresh page data (si tu fais fetch côté page)
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Erreur réseau");
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <Box sx={{  }}>
      {/* ✅ Barre d’actions au-dessus du tableau */}
      <Stack direction="row"  justifyContent="flex-end" sx={{ p: 3, mb: 0}}>
        <Button
        
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push("/convocations/new")}
          sx={{ height: 36, minWidth: 220  , }}
        >
          Nouvelle convocation
        </Button>
      </Stack>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Personnel</TableCell>
            <TableCell>Poste</TableCell>
            <TableCell>Service</TableCell>
            <TableCell>Formation</TableCell>
            <TableCell>Catégorie</TableCell>
            <TableCell>Tags</TableCell>

           
            <TableCell>Statut</TableCell>
            <TableCell>Convocation</TableCell>
          

            <TableCell>Date convocation</TableCell>
            <TableCell>Date visite (prévue)</TableCell>

            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((v) => {
            const p = v.personnel;

            const isAConvoquer = v.statut === "A_CONVOQUER";
            const canCancel = isAConvoquer; // ✅ uniquement si À convoquer

            return (
              <TableRow key={v.id}>
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

                <TableCell sx={{ maxWidth: 220 }}>
                  {Array.isArray(p.tags) && p.tags.length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {p.tags.slice(0, 3).map((t) => (
                        <Chip key={t} size="small" label={t} variant="outlined" />
                      ))}
                      {p.tags.length > 3 && <Chip size="small" label={`+${p.tags.length - 3}`} />}
                    </Box>
                  ) : (
                    <Chip size="small" label="-" variant="outlined" />
                  )}
                </TableCell>

                

                <TableCell>
                  <Chip
                    size="small"
                    label={STATUT_LABELS[v.statut] ?? v.statut}
                    // ✅ vert uniquement si À convoquer
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

                <TableCell align="center">
                  <IconButton color="primary" onClick={() => router.push(`/convocations/${v.id}`)}>
                    <VisibilityIcon />
                  </IconButton>

                  <IconButton color="warning" onClick={() => router.push(`/convocations/${v.id}/edit`)}>
                    <EditIcon />
                  </IconButton>

                  {/* ✅ Annulation seulement si A_CONVOQUER */}
                  {canCancel ? (
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
