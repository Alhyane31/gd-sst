// app/bordereaux/components/BordereauxTable.tsx
"use client";

import {
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import dayjs from "dayjs";

export type BordereauRow = {
  id: string;
  serialNumber: string;
  dateEdition: string | null;
  statut: "NOUVEAU" | "GENERE";
  nbConvocations: number;
  service: { id: string; libelle: string } | null;
};

function formatDate(d?: string | null) {
  if (!d) return "-";
  return dayjs(d).format("DD/MM/YYYY");
}

export default function BordereauxTable({
  rows,
  loading,
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onView,
  onEdit,
  onGenerate,
}: {
  rows: BordereauRow[];
  loading: boolean;
  total: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (p: number) => void;
  onRowsPerPageChange: (n: number) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onGenerate: (id: string) => void;
}) {
  return (
    <Paper elevation={3}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Serial</TableCell>
            <TableCell>Service</TableCell>
            <TableCell>Date édition</TableCell>
            <TableCell>Statut</TableCell>
            <TableCell align="right">Nb convocations</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                Chargement...
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                Aucun bordereau
              </TableCell>
            </TableRow>
          ) : (
            rows.map((b) => (
              <TableRow key={b.id} hover>
                <TableCell>{b.serialNumber}</TableCell>
                <TableCell>{b.service?.libelle ?? "-"}</TableCell>
                <TableCell>{formatDate(b.dateEdition)}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={b.statut === "NOUVEAU" ? "Nouveau" : "Généré"}
                    color={b.statut === "NOUVEAU" ? "warning" : "success"}
                  />
                </TableCell>
                <TableCell align="right">{b.nbConvocations}</TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => onView(b.id)}>
                    <VisibilityIcon />
                  </IconButton>

                  <IconButton
                    color="warning"
                    onClick={() => onEdit(b.id)}
                    disabled={b.statut !== "NOUVEAU"}
                    title={b.statut !== "NOUVEAU" ? "Bordereau déjà généré" : "Modifier"}
                  >
                    <EditIcon />
                  </IconButton>

                  <IconButton
                    color="success"
                    onClick={() => onGenerate(b.id)}
                    disabled={b.statut !== "NOUVEAU"}
                    title={b.statut !== "NOUVEAU" ? "Bordereau déjà généré" : "Générer"}
                  >
                    <PlayArrowIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Paper>
  );
}
