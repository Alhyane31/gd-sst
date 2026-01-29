"use client";

import { Box, Chip, IconButton, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import { useRouter } from "next/navigation";
import { VisiteRow } from "../types";

function fmtDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

export default function VisitesTable({ rows }: { rows: VisiteRow[] }) {
  const router = useRouter();

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Personnel</TableCell>
          <TableCell>Poste</TableCell>
          <TableCell>Service</TableCell>
          <TableCell>Formation</TableCell>
          <TableCell>Catégorie</TableCell>
          <TableCell>Tags</TableCell>

          <TableCell>Type visite</TableCell>
          <TableCell>Statut</TableCell>
          <TableCell>Convocation</TableCell>
          <TableCell>Présence</TableCell>
          <TableCell>État</TableCell>

          <TableCell>Date convocation</TableCell>
          <TableCell>Date visite (prévue)</TableCell>
          <TableCell>Date réalisée</TableCell>

          <TableCell align="center">Actions</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {rows.map((v) => {
          const p = v.personnel;
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

              <TableCell>{v.type}</TableCell>
              <TableCell>
                <Chip size="small" label={v.statut} />
              </TableCell>
              <TableCell>
                <Chip size="small" variant="outlined" label={v.convocationType} />
              </TableCell>
              <TableCell>{v.presence ?? "-"}</TableCell>
              <TableCell>{v.etat ?? "-"}</TableCell>

              <TableCell>{fmtDate(v.dateConvocation)}</TableCell>
              <TableCell>{fmtDate(v.datePrevue)}</TableCell>
              <TableCell>{fmtDate(v.dateRealisee)}</TableCell>

              <TableCell align="center">
                <IconButton color="primary" onClick={() => router.push(`/visites/${v.id}`)}>
                  <VisibilityIcon />
                </IconButton>
                <IconButton color="warning" onClick={() => router.push(`/visites/${v.id}/edit`)}>
                  <EditIcon />
                </IconButton>
                <IconButton color="error">
                  <BlockIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
