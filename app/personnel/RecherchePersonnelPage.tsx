"use client";

import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  MenuItem,
  TablePagination,
  Stack,
} from "@mui/material";
import dayjs from "dayjs";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import Checkbox from "@mui/material/Checkbox";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";

import { buildPersonnelQuery, type Filters, type PersonnelCategorie } from "./components/buildPersonnelQuery";
import RechercheActionsBar from "./components/RechercheActionsBar";
import BulkConvocationDialog from "./components/BulkConvocationDialog";

interface Personnel {
  id: string;
  firstName: string;
  lastName: string;
  poste: { id: string; libelle: string };
  service: { id: string; libelle: string };
  formation: { id: string; libelle: string };
  isActive: boolean;
  categorie?: PersonnelCategorie;
  tags?: string[];

  // ✅ nouveau : dernière convocation
  convocations?: Array<{
  id: string;
  datePrevue: string | null;
  statut: string;
}>;

}

interface Poste {
  id: string;
  libelle: string;
}
interface Formation {
  id: string;
  libelle: string;
}
interface Service {
  id: string;
  libelle: string;
}

type ApiResponse = {
  items: Personnel[];
  total: number;
  page: number;
  pageSize: number;
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

export default function RecherchePersonnelPage() {
  const { status } = useSession();
  const router = useRouter();

  const [openBulk, setOpenBulk] = useState(false);
const [bulkMode, setBulkMode] = useState<"ALL" | "SELECTED">("ALL");

const setOpenBulkMode = (m: "ALL" | "SELECTED") => {
  setBulkMode(m);
  setOpenBulk(true);
};

  const [postes, setPostes] = useState<Poste[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
const [openBulkSelected, setOpenBulkSelected] = useState(false);

  const empty: Filters = {
    nom: "",
    prenom: "",
    poste: "",
    service: "",
    formation: "",
    categorie: "",
    tag: "",
    convStatut: "",
    datePrevueFrom: "",
    datePrevueTo: "",
  };

  const [filtersDraft, setFiltersDraft] = useState<Filters>(empty);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(empty);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [personnels, setPersonnels] = useState<Personnel[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

useEffect(() => {
  setSelectedIds([]);
}, [appliedFilters, page, rowsPerPage]);

//Debut helper===============================================================
const toggleOne = (id: string) => {
  setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
};

const toggleAllOnPage = () => {
  const idsOnPage = personnels.map((p) => p.id);
  const allSelected = idsOnPage.length > 0 && idsOnPage.every((id) => selectedIds.includes(id));

  setSelectedIds((prev) => {
    if (allSelected) return prev.filter((id) => !idsOnPage.includes(id));
    const set = new Set(prev);
    idsOnPage.forEach((id) => set.add(id));
    return Array.from(set);
  });
};

const selectedTotal = selectedIds.length;

//fin helper============================================================
  // fetch listes
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/postes").then((res) => res.json()).then(setPostes);
    fetch("/api/formations").then((res) => res.json()).then(setFormations);
  }, [status]);

  // services selon formation (draft)
  useEffect(() => {
    if (!filtersDraft.formation) {
      setServices([]);
      return;
    }
    fetch(`/api/formations/${filtersDraft.formation}/services`)
      .then((res) => res.json())
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => setServices([]));
  }, [filtersDraft.formation]);

  const fetchPersonnels = useCallback(async (f: Filters, p: number, size: number) => {
    setLoading(true);
    try {
      const qs = buildPersonnelQuery(f, p, size);
      const res = await fetch(`/api/personnel?${qs}`);

      if (res.status === 401) {
        signIn();
        return;
      }
      if (!res.ok) {
        setPersonnels([]);
        setTotal(0);
        return;
      }

      const data: ApiResponse = await res.json();
      setPersonnels(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error("Erreur fetch :", err);
      setPersonnels([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchPersonnels(appliedFilters, page, rowsPerPage);
  }, [status, appliedFilters, page, rowsPerPage, fetchPersonnels]);

  const handleDraftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiltersDraft({ ...filtersDraft, [e.target.name]: e.target.value });
  };

  const handleSearchClick = () => {
    setAppliedFilters(filtersDraft);
    setPage(0);
  };

  const handleReset = () => {
    setFiltersDraft(empty);
    setAppliedFilters(empty);
    setServices([]);
    setPage(0);
  };

  const field20 = {
    flexBasis: { xs: "100%", md: "20%" },
    flexGrow: 1,
    minWidth: 200,
  } as const;

  // =========================
  // ✅ Export tout le résultat filtré
  // =========================
  const exportCsv = async () => {
    try {
      const esc = (v: any) => {
        const s = (v ?? "").toString();
        const needs = /[",\n;]/.test(s);
        const out = s.replace(/"/g, '""');
        return needs ? `"${out}"` : out;
      };

      const header = ["Matricule", "Nom", "Prénom", "Poste", "Service", "Formation", "Catégorie", "Tags", "Statut"];
      const lines: string[] = [header.join(";")];

      const pageSize = 500;
      let p = 0;
      let fetched = 0;

      while (true) {
        const qs = buildPersonnelQuery(appliedFilters, p, pageSize);
        const res = await fetch(`/api/personnel?${qs}`);
        if (!res.ok) break;

        const data: ApiResponse = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        if (items.length === 0) break;

        items.forEach((it) => {
          const tags = Array.isArray(it.tags) ? it.tags.join(", ") : "";
          lines.push(
            [
              "", // placeholder matricule (à ajouter plus tard)
              esc(it.lastName),
              esc(it.firstName),
              esc(it.poste?.libelle),
              esc(it.service?.libelle),
              esc(it.formation?.libelle),
              esc(it.categorie ?? ""),
              esc(tags),
              esc(it.isActive ? "Actif" : "Inactif"),
            ].join(";")
          );
        });

        fetched += items.length;
        if (fetched >= data.total) break;
        p += 1;
      }

      if (lines.length === 1) {
        alert("Aucune donnée à exporter.");
        return;
      }

      const csv = "\uFEFF" + lines.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const fileName = `personnel_resultat_${new Date().toISOString().slice(0, 10)}.csv`;

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("exportCsv error", e);
      alert("Erreur export");
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h4" mb={3}>
        Recherche du personnel
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }} elevation={12}>
        <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" alignItems="center">
          <TextField size="small" label="Nom" name="nom" value={filtersDraft.nom} onChange={handleDraftChange} sx={field20} />
          <TextField size="small" label="Prénom" name="prenom" value={filtersDraft.prenom} onChange={handleDraftChange} sx={field20} />

          <TextField select size="small" label="Poste" name="poste" value={filtersDraft.poste} onChange={handleDraftChange} sx={field20}>
            <MenuItem value="">Tous</MenuItem>
            {postes.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.libelle}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Formation"
            name="formation"
            value={filtersDraft.formation}
            onChange={(e) => setFiltersDraft({ ...filtersDraft, formation: e.target.value, service: "" })}
            sx={field20}
          >
            <MenuItem value="">Toutes</MenuItem>
            {formations.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                {f.libelle}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Service"
            name="service"
            value={filtersDraft.service}
            onChange={handleDraftChange}
            disabled={!filtersDraft.formation}
            sx={field20}
          >
            <MenuItem value="">Tous</MenuItem>
            {services.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.libelle}
              </MenuItem>
            ))}
          </TextField>

          <TextField select size="small" label="Catégorie" name="categorie" value={filtersDraft.categorie} onChange={handleDraftChange} sx={field20}>
            <MenuItem value="">Toutes</MenuItem>
            <MenuItem value="VP">VP</MenuItem>
            <MenuItem value="SMR">SMR</MenuItem>
          </TextField>

          <TextField size="small" label="Tag (exact)" name="tag" value={filtersDraft.tag} onChange={handleDraftChange} placeholder='Ex: "Femme enceinte"' sx={field20} />
          <TextField
  select
  size="small"
  label="Statut convocation"
  name="convStatut"
  value={filtersDraft.convStatut}
  onChange={handleDraftChange}
  sx={field20}
>
  <MenuItem value="">Tous</MenuItem>
  {Object.keys(STATUT_LABELS).map((k) => (
    <MenuItem key={k} value={k}>
      {STATUT_LABELS[k] ?? k}
    </MenuItem>
  ))}
</TextField>

<TextField
  size="small"
  type="date"
  label="Date prévue (du)"
  name="datePrevueFrom"
  value={filtersDraft.datePrevueFrom}
  onChange={handleDraftChange}
  sx={field20}
  InputLabelProps={{ shrink: true }}
/>

<TextField
  size="small"
  type="date"
  label="Date prévue (au)"
  name="datePrevueTo"
  value={filtersDraft.datePrevueTo}
  onChange={handleDraftChange}
  sx={field20}
  InputLabelProps={{ shrink: true }}
/>
          <Box sx={{ flexBasis: { xs: "100%", md: "20%" }, flexGrow: 1, minWidth: 200, display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearchClick}>
              Rechercher
            </Button>
            <Button variant="outlined" color="secondary" startIcon={<ClearIcon />} onClick={handleReset}>
              Vider
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* ✅ Boutons au-dessus du tableau */}
 
<RechercheActionsBar
  total={total}
  loading={loading}
  selectedCount={selectedIds.length}
  onExport={exportCsv}
  onOpenBulkAll={() => setOpenBulkMode("ALL")}
  onOpenBulkSelected={() => setOpenBulkMode("SELECTED")}
/>
      <Paper elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={personnels.length > 0 && personnels.every((p) => selectedIds.includes(p.id))}
                  indeterminate={
                    personnels.some((p) => selectedIds.includes(p.id)) &&
                    !personnels.every((p) => selectedIds.includes(p.id))
                  }
                  onChange={toggleAllOnPage}
                />
              </TableCell>
              <TableCell>Nom et Prénom</TableCell>
              <TableCell>Poste</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Formation</TableCell>
              <TableCell>Catégorie</TableCell>
              <TableCell>Tags</TableCell>
                {/* ✅ nouveaux */}
              <TableCell>Dernière convocation (date prévue)</TableCell>
              <TableCell>Statut dernière convocation</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Chargement...</TableCell>
              </TableRow>
            ) : personnels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Aucun personnel trouvé</TableCell>
              </TableRow>
            ) : (
              personnels.map((p) => (
                <TableRow key={p.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox checked={selectedIds.includes(p.id)} onChange={() => toggleOne(p.id)} />
                    </TableCell>
                  <TableCell>{`${p.lastName} ${p.firstName}`}</TableCell>
                  <TableCell>{p.poste?.libelle ?? "-"}</TableCell>
                  <TableCell>{p.service?.libelle ?? "-"}</TableCell>
                  <TableCell>{p.formation?.libelle ?? "-"}</TableCell>

                  <TableCell>
                    <Chip size="small" label={p.categorie === "SMR" ? "SMR" : "VP"} color={p.categorie === "SMR" ? "warning" : "default"} />
                  </TableCell>

                  <TableCell sx={{ maxWidth: 280 }}>
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
    {p.convocations?.[0]?.datePrevue
      ?dayjs( p.convocations?.[0].datePrevue).format("YYYY-MM-DD")
      : "-"}
  </TableCell>

  {/* ✅ Dernier statut convocation */}
 <TableCell>
  {(() => {
    const statut = p.convocations?.[0]?.statut;
    const label = statut ? STATUT_LABELS[statut] ?? statut : null;

    return label ? (
      <Chip size="small" label={label} variant="outlined" />
    ) : (
      <Chip size="small" label="-" variant="outlined" />
    );
  })()}
</TableCell>
                  <TableCell>
                    <Chip label={p.isActive ? "Actif" : "Inactif"} color={p.isActive ? "success" : "default"} size="small" />
                  </TableCell>

                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => router.push(`/personnel/${p.id}`)}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton color="warning" onClick={() => router.push(`/personnel/${p.id}/edit`)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error">
                      <BlockIcon />
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
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50,100,200]}
        />
      </Paper>

      <BulkConvocationDialog
  open={openBulk}
  onClose={() => setOpenBulk(false)}
  appliedFilters={appliedFilters}
  total={bulkMode === "ALL" ? total : selectedIds.length}
   personnelIds={selectedIds}
  onSuccess={() => fetchPersonnels(appliedFilters, page, rowsPerPage)}
/>
    </Box>
  );
}
