"use client";

import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Stack,
} from "@mui/material";

import { useState, useEffect, useCallback } from "react";

import { useRouter } from "next/navigation";

type PersonnelCategorie = "SMR" | "VP";

type PersonnelMini = {
  id: string;
  firstName: string;
  lastName: string;
  categorie?: PersonnelCategorie;
  tags?: string[];
  poste?: { libelle: string };
  service?: { libelle: string };
  formation?: { libelle: string };
};


type ConvocationStatut =
  | "A_CONVOQUER"
  | "CONVOCATION_GENEREE"
  | "A_TRAITER"
  | "A_RELANCER"
  | "RELANCEE"
  | "REALISEE";
type ConvocationType = "INITIALE" | "RELANCE_1" | "RELANCE_2" | "RELANCE_3";

const toDatetimeLocal = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function ConvocationCreatePage() {
    const [personnels, setPersonnels] = useState<PersonnelMini[]>([]);
const [total, setTotal] = useState(0);
const [loadingPersonnels, setLoadingPersonnels] = useState(false);

// pagination popup
const [page, setPage] = useState(0);
const [rowsPerPage, setRowsPerPage] = useState(5);

  const router = useRouter();


  const fetchPersonnels = async () => {
  setLoadingPersonnels(true);
  try {
    const params = new URLSearchParams();

    // recherche texte (nom/prénom)
    if (filters.q) params.set("nom", filters.q);

    // filtres
    if (filters.categorie) params.set("categorie", filters.categorie);
    if (filters.tag) params.set("tag", filters.tag); // exact (tags.has)

    // pagination
    params.set("page", String(page));
    params.set("pageSize", String(rowsPerPage));

    const res = await fetch(`/api/personnel?${params.toString()}`);
    if (!res.ok) {
      setPersonnels([]);
      setTotal(0);
      return;
    }

    const data = await res.json();
    setPersonnels(data.items ?? []);
    setTotal(data.total ?? 0);
  } catch (e) {
    console.error("fetchPersonnels error", e);
    setPersonnels([]);
    setTotal(0);
  } finally {
    setLoadingPersonnels(false);
  }
};



  // ===== form state
  const [selectedPersonnel, setSelectedPersonnel] = useState<PersonnelMini | null>(null);

const [form, setForm] = useState({
  datePrevue: "",          // sera un datetime-local
  dateConvocation: "",     // sera un datetime-local
  statut: "A_CONVOQUER" as ConvocationStatut,
  convocationType: "INITIALE" as ConvocationType,
  commentaire: "",
});


  // ===== dialog state
  const [open, setOpen] = useState(false);

  const [filters, setFilters] = useState({
    q: "", // nom/prénom contient
    categorie: "" as "" | PersonnelCategorie,
    tag: "", // contient (front only)
  });

  
useEffect(() => {
  const now = new Date();

  const datePrevue = new Date();
  datePrevue.setDate(datePrevue.getDate() + 14);
  datePrevue.setHours(9, 0, 0, 0); // ⏰ 09:00 pile

  setForm((prev) => ({
    ...prev,
    dateConvocation: toDatetimeLocal(now),
    datePrevue: toDatetimeLocal(datePrevue),
  }));
}, []);

useEffect(() => {
  if (!open) return; // 🔑 fetch seulement quand popup ouverte
  fetchPersonnels();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [open, filters, page, rowsPerPage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    // front only : juste log
    if (!selectedPersonnel) {
      alert("Choisis un personnel d’abord.");
      return;
    }
    if (!form.datePrevue) {
      alert("Date prévue obligatoire.");
      return;
    }

   const res = await fetch("/api/convocations", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
  personnelId: selectedPersonnel.id,
  datePrevue: form.datePrevue,             // datetime
  dateConvocation: form.dateConvocation,   // datetime
  statut: form.statut,
  convocationType: form.convocationType,
  commentaire: form.commentaire,
}),

});

if (!res.ok) {
  const err = await res.json().catch(() => ({}));
  alert(err.error ?? "Erreur enregistrement");
  return;
}

router.push("/convocations");


   
  };

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Créer une convocation</Typography>
        <Button variant="outlined" onClick={() => router.back()}>
          Retour
        </Button>
      </Box>

     <Paper sx={{ p: 3 }} elevation={3}>
  <Grid container spacing={2}>
 

  {/* ================= Personnel (ligne 1) ================= */}
 
    <Typography variant="subtitle1" sx={{ mb: 1 }}>
      Personnel
    </Typography>

    {selectedPersonnel ? (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography sx={{ fontWeight: 700 }}>
              {selectedPersonnel.lastName} {selectedPersonnel.firstName}
            </Typography>

            {selectedPersonnel.categorie && (
              <Chip
                size="small"
                label={selectedPersonnel.categorie}
                color={selectedPersonnel.categorie === "SMR" ? "warning" : "default"}
              />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary">
            {selectedPersonnel.poste?.libelle} — {selectedPersonnel.service?.libelle} —{" "}
            {selectedPersonnel.formation?.libelle}
          </Typography>

          {(selectedPersonnel.tags?.length ?? 0) > 0 && (
            <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selectedPersonnel.tags!.map((t) => (
                <Chip key={t} size="small" label={t} variant="outlined" />
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
          <Button size="small" variant="outlined" sx={{ minWidth: 120, height: 36 }} onClick={() => setOpen(true)}>
            Changer
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            sx={{ minWidth: 120, height: 36 }}
            onClick={() => setSelectedPersonnel(null)}
          >
            Retirer
          </Button>
        </Box>
      </Paper>
    ) : (
      <Button size="small" variant="contained" sx={{ minWidth: 220, height: 36 }} onClick={() => setOpen(true)}>
        Choisir un personnel
      </Button>
    )}
  </Grid>

  <Grid item xs={12}>
  <Box sx={{ height: 30
   }} /> {/* espace visuel clair */}
</Grid>

  {/* ================= Formulaire (ligne 3+) : container séparé ================= */}
 
    
      {/* Ligne champs principaux */}
    <Grid item xs={12}>
  <Stack
    direction={{ xs: "column", md: "row" }}
    spacing={2}
    useFlexGap
    sx={{
      flexWrap: { xs: "wrap", md: "nowrap" }, // ✅ 1 seule ligne en desktop
    }}
  >
   

    <TextField
  size="small"
  type="datetime-local"
  label="Date prévue"
  name="datePrevue"
  InputLabelProps={{ shrink: true }}
  value={form.datePrevue}
  onChange={handleChange}
  sx={{ flex: { md: "0 0 20%" }, minWidth: 220 }}
  fullWidth
/>
<TextField
  size="small"
  type="datetime-local"
  label="Date convocation"
  name="dateConvocation"
  InputLabelProps={{ shrink: true }}
  value={form.dateConvocation}
  onChange={handleChange}
  sx={{ flex: { md: "0 0 20%" }, minWidth: 220 }}
  fullWidth
/>

    <TextField
      select
      size="small"
      label="Statut"
      name="statut"
      value={form.statut}
      onChange={handleChange}
      sx={{ flex: { md: "0 0 20%" }, minWidth: 200 }}
      fullWidth
    >
      <MenuItem value="A_CONVOQUER">À convoquer</MenuItem>
      <MenuItem value="CONVOCATION_GENEREE">Convocation générée</MenuItem>
      <MenuItem value="A_TRAITER">À traiter</MenuItem>
      <MenuItem value="A_RELANCER">À relancer</MenuItem>
      <MenuItem value="RELANCEE">Relancé</MenuItem>
      <MenuItem value="REALISEE">Réalisé</MenuItem>
    </TextField>

    <TextField
      select
      size="small"
      label="Type convocation"
      name="convocationType"
      value={form.convocationType}
      onChange={handleChange}
      sx={{ flex: { md: "0 0 20%" }, minWidth: 200 }}
      fullWidth
    >
      <MenuItem value="INITIALE">Initiale</MenuItem>
      <MenuItem value="RELANCE_1">Relance 1</MenuItem>
      <MenuItem value="RELANCE_2">Relance 2</MenuItem>
      <MenuItem value="RELANCE_3">Relance 3</MenuItem>
    </TextField>
  </Stack>
</Grid>





   <Grid item xs={12}>
  <Box sx={{ height: 30
   }} /> {/* espace visuel clair */}
</Grid>
 

<Grid item xs={12}>
  <Box
    sx={{
      display: "flex",
      gap: 2,
      alignItems: "flex-start",
      mt: 1,
    }}
  >
    {/* Commentaire */}
    <TextField
  size="small"
  label="Commentaire"
  name="commentaire"
  value={form.commentaire}
  onChange={handleChange}
  multiline
  minRows={2}
  sx={{ flex: "0 0 70%" }}
  fullWidth
/>

    {/* Actions */}
    <Box
      sx={{
        flex: "0 0 30%",
        display: "flex",
        justifyContent: "flex-end",
        gap: 2,
        pt: "6px", // alignement vertical avec textarea
      }}
    >
      <Button variant="outlined" size="small"  onClick={() => router.push("/convocations")} sx={{ minWidth: 140 }}>
        Annuler
      </Button>
      <Button variant="contained"  onClick={handleSave} size="small" sx={{ minWidth: 140 }}>
        Enregistrer
      </Button>
    </Box>
  </Box>
</Grid>
</Paper>

      {/* =======================
          Dialog sélection personnel
      ======================= */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>Choisir un personnel</DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
            <TextField
              size="small"
              label="Nom/Prénom (contient)"
              value={filters.q}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, q: e.target.value }));
                setPage(0);
              }}
              sx={{ flexBasis: { xs: "100%", md: "40%" }, flexGrow: 1, minWidth: 240 }}
            />

            <TextField
              select
              size="small"
              label="Catégorie"
              value={filters.categorie}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, categorie: e.target.value as any }));
                setPage(0);
              }}
              sx={{ flexBasis: { xs: "100%", md: "20%" }, flexGrow: 1, minWidth: 200 }}
            >
              <MenuItem value="">Toutes</MenuItem>
              <MenuItem value="VP">VP</MenuItem>
              <MenuItem value="SMR">SMR</MenuItem>
            </TextField>

            <TextField
              size="small"
              label="Tag (contient)"
              value={filters.tag}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, tag: e.target.value }));
                setPage(0);
              }}
              sx={{ flexBasis: { xs: "100%", md: "40%" }, flexGrow: 1, minWidth: 240 }}
            />
          </Stack>

          <Paper variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Poste</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Formation</TableCell>
                  <TableCell>Catégorie</TableCell>
                  <TableCell>Tags</TableCell>
                  <TableCell align="center">Choisir</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
               {loadingPersonnels ? (
  <TableRow>
    <TableCell colSpan={7} align="center">
      Chargement...
    </TableCell>
  </TableRow>
) : personnels.length === 0 ? (
  <TableRow>
    <TableCell colSpan={7} align="center">
      Aucun personnel
    </TableCell>
  </TableRow>
) : (
  personnels.map((p) => (
    <TableRow key={p.id} hover>
      <TableCell>{p.lastName} {p.firstName}</TableCell>
      <TableCell>{p.poste?.libelle ?? "-"}</TableCell>
      <TableCell>{p.service?.libelle ?? "-"}</TableCell>
      <TableCell>{p.formation?.libelle ?? "-"}</TableCell>
      <TableCell>
        <Chip size="small" label={p.categorie ?? "-"} />
      </TableCell>
      <TableCell sx={{ maxWidth: 260 }}>
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
      <TableCell align="center">
        <Button
          variant="contained"
          size="small"
          onClick={() => {
            setSelectedPersonnel(p);
            setOpen(false);
          }}
        >
          Choisir
        </Button>
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
              rowsPerPageOptions={[5, 10, 25]}
            />
          </Paper>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
