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

import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";

type PersonnelCategorie = "SMR" | "VP";

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

type Filters = {
  nom: string;
  prenom: string;
  poste: string;
  service: string;
  formation: string;
  categorie: "" | PersonnelCategorie;
  tag: string; // exact match (API: tags.has)
};

type ApiResponse = {
  items: Personnel[];
  total: number;
  page: number;
  pageSize: number;
};

export default function RecherchePersonnelPage() {
  const { status } = useSession();
  const router = useRouter();

  const [postes, setPostes] = useState<Poste[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const empty: Filters = {
    nom: "",
    prenom: "",
    poste: "",
    service: "",
    formation: "",
    categorie: "",
    tag: "",
  };

  const [filtersDraft, setFiltersDraft] = useState<Filters>(empty);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(empty);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [personnels, setPersonnels] = useState<Personnel[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

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
      const params = new URLSearchParams();

      if (f.prenom) params.set("prenom", f.prenom);
      if (f.nom) params.set("nom", f.nom);
      if (f.poste) params.set("posteId", f.poste);
      if (f.formation) params.set("formationId", f.formation);
      if (f.service) params.set("serviceId", f.service);

      // ✅ nouveaux filtres (côté API)
      if (f.categorie) params.set("categorie", f.categorie);
      if (f.tag) params.set("tag", f.tag); // exact

      params.set("page", String(p));
      params.set("pageSize", String(size));

      const res = await fetch(`/api/personnel?${params.toString()}`);

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

  // ✅ style commun : 20% desktop, 100% mobile
  const field20 = {
    flexBasis: { xs: "100%", md: "20%" },
    flexGrow: 1,
    minWidth: 200,
  } as const;

  return (
    <Box p={4}>
      <Typography variant="h4" mb={3}>
        Recherche du personnel
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }} elevation={12}>
        {/* ✅ barre de filtres en flex, colonnes égales */}
        <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" alignItems="center">
          <TextField
            size="small"
            label="Nom"
            name="nom"
            value={filtersDraft.nom}
            onChange={handleDraftChange}
            sx={field20}
          />

          <TextField
            size="small"
            label="Prénom"
            name="prenom"
            value={filtersDraft.prenom}
            onChange={handleDraftChange}
            sx={field20}
          />

          <TextField
            select
            size="small"
            label="Poste"
            name="poste"
            value={filtersDraft.poste}
            onChange={handleDraftChange}
            sx={field20}
          >
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

          <TextField
            select
            size="small"
            label="Catégorie"
            name="categorie"
            value={filtersDraft.categorie}
            onChange={handleDraftChange}
            sx={field20}
          >
            <MenuItem value="">Toutes</MenuItem>
            <MenuItem value="VP">VP</MenuItem>
            <MenuItem value="SMR">SMR</MenuItem>
          </TextField>

          <TextField
            size="small"
            label="Tag (exact)"
            name="tag"
            value={filtersDraft.tag}
            onChange={handleDraftChange}
            placeholder='Ex: "Femme enceinte"'
            sx={field20}
          />

          {/* ✅ actions */}
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

      <Paper elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom et Prénom</TableCell>
              <TableCell>Poste</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Formation</TableCell>
              <TableCell>Catégorie</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : personnels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Aucun personnel trouvé
                </TableCell>
              </TableRow>
            ) : (
              personnels.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{`${p.lastName} ${p.firstName}`}</TableCell>
                  <TableCell>{p.poste.libelle}</TableCell>
                  <TableCell>{p.service.libelle}</TableCell>
                  <TableCell>{p.formation.libelle}</TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={p.categorie === "SMR" ? "SMR" : "VP"}
                      color={p.categorie === "SMR" ? "warning" : "default"}
                    />
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
                    <Chip
                      label={p.isActive ? "Actif" : "Inactif"}
                      color={p.isActive ? "success" : "default"}
                      size="small"
                    />
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
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>
    </Box>
  );
}
