"use client";

import {
  Box, Paper, TextField, Button, Typography, Table, TableBody,
  TableCell, TableHead, TableRow, IconButton, Chip, MenuItem,
  TablePagination, Stack,
} from "@mui/material";
import dayjs from "dayjs";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";

// ─── Types ───────────────────────────────────────────────────────────────────

type VisiteType = "ANNUELLE" | "RAPPROCHEE" | "SPONTANNE" | "EXPERTISE" | "AUTRE";
type VisiteStatut = "BROUILLON" | "EN_COURS" | "CLOTUREE" | "ANNULEE";

interface Visite {
  id: string;
  type: VisiteType;
  typeAutre?: string | null;
  statut: VisiteStatut;
  dateDebut: string;
  dateFin?: string | null;
  personnel: { id: string; firstName: string; lastName: string };
  convocation?: { id: string; datePrevue: string | null } | null;
  createdBy: { id: string; name?: string | null };
  createdAt: string;
}

interface Filters {
  nom: string;
  prenom: string;
  type: string;
  statut: string;
  dateDebutFrom: string;
  dateDebutTo: string;
}

type ApiResponse = { items: Visite[]; total: number; page: number; pageSize: number };

// ─── Labels ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<VisiteType, string> = {
  ANNUELLE: "Annuelle",
  RAPPROCHEE: "Rapprochée",
  SPONTANNE: "Spontanée",
  EXPERTISE: "Expertise",
  AUTRE: "Autre",
};

const STATUT_LABELS: Record<VisiteStatut, string> = {
  BROUILLON: "Brouillon",
  EN_COURS: "En cours",
  CLOTUREE: "Clôturée",
  ANNULEE: "Annulée",
};

const STATUT_COLORS: Record<VisiteStatut, "default" | "warning" | "success" | "error"> = {
  BROUILLON: "default",
  EN_COURS: "warning",
  CLOTUREE: "success",
  ANNULEE: "error",
};

// ─── Query builder ───────────────────────────────────────────────────────────

function buildQuery(f: Filters, page: number, pageSize: number): string {
  const p = new URLSearchParams();
  if (f.nom)           p.set("nom", f.nom);
  if (f.prenom)        p.set("prenom", f.prenom);
  if (f.type)          p.set("type", f.type);
  if (f.statut)        p.set("statut", f.statut);
  if (f.dateDebutFrom) p.set("dateDebutFrom", f.dateDebutFrom);
  if (f.dateDebutTo)   p.set("dateDebutTo", f.dateDebutTo);
  p.set("page", String(page));
  p.set("pageSize", String(pageSize));
  return p.toString();
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RechercheVisitePage() {
  const { status } = useSession();
  const router = useRouter();

  const empty: Filters = {
    nom: "", prenom: "", type: "", statut: "",
    dateDebutFrom: "", dateDebutTo: "",
  };

  const [filtersDraft, setFiltersDraft]   = useState<Filters>(empty);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(empty);
  const [page, setPage]           = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [visites, setVisites]     = useState<Visite[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(false);

  const field = {
    flexBasis: { xs: "100%", md: "20%" },
    flexGrow: 1,
    minWidth: 200,
  } as const;

  const handleDraftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiltersDraft((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSearch = () => { setAppliedFilters(filtersDraft); setPage(0); };
  const handleReset  = () => { setFiltersDraft(empty); setAppliedFilters(empty); setPage(0); };

  const fetchVisites = useCallback(async (f: Filters, p: number, size: number) => {
    setLoading(true);
    try {
      const qs = buildQuery(f, p, size);
      const res = await fetch(`/api/visites?${qs}`);
      if (res.status === 401) { signIn(); return; }
      if (!res.ok) { setVisites([]); setTotal(0); return; }
      const data: ApiResponse = await res.json();
      setVisites(data.items);
      setTotal(data.total);
    } catch {
      setVisites([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchVisites(appliedFilters, page, rowsPerPage);
  }, [status, appliedFilters, page, rowsPerPage, fetchVisites]);

  // ─── Export CSV ────────────────────────────────────────────────────────────

  const exportCsv = async () => {
    const esc = (v: any) => {
      const s = (v ?? "").toString();
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ["Nom", "Prénom", "Type", "Statut", "Date début", "Date fin", "Convocation"];
    const lines = [header.join(";")];
    let p = 0, fetched = 0;
    while (true) {
      const res = await fetch(`/api/visites?${buildQuery(appliedFilters, p, 500)}`);
      if (!res.ok) break;
      const data: ApiResponse = await res.json();
      if (!data.items?.length) break;
      data.items.forEach((v) => lines.push([
        esc(v.personnel.lastName),
        esc(v.personnel.firstName),
        esc(TYPE_LABELS[v.type] ?? v.type),
        esc(STATUT_LABELS[v.statut] ?? v.statut),
        esc(dayjs(v.dateDebut).format("DD/MM/YYYY")),
        esc(v.dateFin ? dayjs(v.dateFin).format("DD/MM/YYYY") : ""),
        esc(v.convocation ? "Oui" : "Non"),
      ].join(";")));
      fetched += data.items.length;
      if (fetched >= data.total) break;
      p++;
    }
    if (lines.length === 1) { alert("Aucune donnée."); return; }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `visites_${dayjs().format("YYYY-MM-DD")}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Box p={4}>
      <Typography variant="h4" mb={3}>Recherche des visites</Typography>

      {/* Filtres */}
      <Paper sx={{ p: 3, mb: 4 }} elevation={12}>
        <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" alignItems="center">
          <TextField size="small" label="Nom" name="nom"
            value={filtersDraft.nom} onChange={handleDraftChange} sx={field} />
          <TextField size="small" label="Prénom" name="prenom"
            value={filtersDraft.prenom} onChange={handleDraftChange} sx={field} />

          <TextField select size="small" label="Type" name="type"
            value={filtersDraft.type} onChange={handleDraftChange} sx={field}>
            <MenuItem value="">Tous</MenuItem>
            {(Object.keys(TYPE_LABELS) as VisiteType[]).map((k) => (
              <MenuItem key={k} value={k}>{TYPE_LABELS[k]}</MenuItem>
            ))}
          </TextField>

          <TextField select size="small" label="Statut" name="statut"
            value={filtersDraft.statut} onChange={handleDraftChange} sx={field}>
            <MenuItem value="">Tous</MenuItem>
            {(Object.keys(STATUT_LABELS) as VisiteStatut[]).map((k) => (
              <MenuItem key={k} value={k}>{STATUT_LABELS[k]}</MenuItem>
            ))}
          </TextField>

          <TextField size="small" type="date" label="Date début (du)" name="dateDebutFrom"
            value={filtersDraft.dateDebutFrom} onChange={handleDraftChange}
            sx={field} InputLabelProps={{ shrink: true }} />
          <TextField size="small" type="date" label="Date début (au)" name="dateDebutTo"
            value={filtersDraft.dateDebutTo} onChange={handleDraftChange}
            sx={field} InputLabelProps={{ shrink: true }} />

          <Box sx={{ flexBasis: { xs: "100%", md: "20%" }, flexGrow: 1, minWidth: 200, display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch}>
              Rechercher
            </Button>
            <Button variant="outlined" color="secondary" startIcon={<ClearIcon />} onClick={handleReset}>
              Vider
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* Barre d'actions */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="body2" color="text.secondary">
          {loading ? "Chargement..." : `${total} résultat${total > 1 ? "s" : ""}`}
        </Typography>
        <Button variant="outlined" size="small" onClick={exportCsv} disabled={loading || total === 0}>
          Exporter CSV
        </Button>
      </Stack>

      {/* Tableau */}
      <Paper elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Personnel</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date début</TableCell>
              <TableCell>Date fin</TableCell>
              <TableCell>Convocation</TableCell>
              <TableCell>Créée par</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Chargement...</TableCell>
              </TableRow>
            ) : visites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Aucune visite trouvée</TableCell>
              </TableRow>
            ) : (
              visites.map((v) => (
                <TableRow key={v.id} hover>
                  <TableCell>
                    {v.personnel.lastName} {v.personnel.firstName}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={TYPE_LABELS[v.type] ?? v.type} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={STATUT_LABELS[v.statut] ?? v.statut}
                      color={STATUT_COLORS[v.statut]}
                    />
                  </TableCell>
                  <TableCell>{dayjs(v.dateDebut).format("DD/MM/YYYY")}</TableCell>
                  <TableCell>{v.dateFin ? dayjs(v.dateFin).format("DD/MM/YYYY") : "—"}</TableCell>
                  <TableCell>
                    {v.convocation?.datePrevue
                        ? dayjs(v.convocation.datePrevue).format("DD/MM/YYYY")
                        : "—"}
                    </TableCell>
                  <TableCell>{v.createdBy?.lastName} {v.createdBy?.firstName}</TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => router.push(`/visites/${v.id}`)}>
                      <VisibilityIcon />
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
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
        />
      </Paper>
    </Box>
  );
}