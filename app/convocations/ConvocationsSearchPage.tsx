"use client";

import { Box, Paper, TablePagination, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";

import ConvocationsFiltersBar from "./components/ConvocationsFiltersBar";
import ConvocationsTable from "./components/ConvocationsTable";
import { ApiResponse, Formation, Poste, Service, ConvocationRow, ConvocationsFilters } from "./types";

export default function ConvocationsSearchPage() {
  const { status } = useSession();

  const [postes, setPostes] = useState<Poste[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const empty: ConvocationsFilters = {
    nom: "",
    prenom: "",
    posteId: "",
    formationId: "",
    serviceId: "",
    categorie: "",
    tag: "",

    visiteType: "",
    statut: "",
    convocationType: "",
    presence: "",
    etat: "",

    dateConvocFrom: "",
    dateConvocTo: ""
    
    
  };

  const [draft, setDraft] = useState<ConvocationsFilters>(empty);
  const [applied, setApplied] = useState<ConvocationsFilters>(empty);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [rows, setRows] = useState<ConvocationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // listes
  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/postes").then((r) => r.json()).then(setPostes);
    fetch("/api/formations").then((r) => r.json()).then(setFormations);
  }, [status]);

  // services selon formation (draft)
  useEffect(() => {
    if (!draft.formationId) {
      setServices([]);
      return;
    }
    fetch(`/api/formations/${draft.formationId}/services`)
      .then((r) => r.json())
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => setServices([]));
  }, [draft.formationId]);

  const fetchConvocations = useCallback(async (f: ConvocationsFilters, p: number, size: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // personnel
      if (f.nom) params.set("nom", f.nom);
      if (f.prenom) params.set("prenom", f.prenom);
      if (f.posteId) params.set("posteId", f.posteId);
      if (f.formationId) params.set("formationId", f.formationId);
      if (f.serviceId) params.set("serviceId", f.serviceId);
      if (f.categorie) params.set("categorie", f.categorie);
      if (f.tag) params.set("tag", f.tag);

      // convocation
      if (f.convocationType) params.set("convocationType", f.convocationType);
      if (f.statut) params.set("statut", f.statut);
      if (f.convocationType) params.set("convocationType", f.convocationType);
      if (f.presence) params.set("presence", f.presence);
      if (f.etat) params.set("etat", f.etat);

      if (f.dateConvocFrom) params.set("dateConvocFrom", f.dateConvocFrom);
      if (f.dateConvocTo) params.set("dateConvocTo", f.dateConvocTo);
     

      params.set("page", String(p));
      params.set("pageSize", String(size));

      const res = await fetch(`/api/convocations?${params.toString()}`);

      if (res.status === 401) {
        signIn();
        return;
      }
      if (!res.ok) {
        setRows([]);
        setTotal(0);
        return;
      }

      const data: ApiResponse<ConvocationRow> = await res.json();
      setRows(data.items);
      setTotal(data.total);
    } catch (e) {
      console.error("fetchConvocations error:", e);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchConvocations(applied, page, rowsPerPage);
  }, [status, applied, page, rowsPerPage, fetchConvocations]);

  const onSearch = () => {
    setApplied(draft);
    setPage(0);
  };

  const onReset = () => {
    setDraft(empty);
    setApplied(empty);
    setServices([]);
    setPage(0);
  };

  return (
    <Box p={4}>
      <Typography variant="h4" mb={3}>
        Recherche des convocations
      </Typography>

      <ConvocationsFiltersBar
        postes={postes}
        formations={formations}
        services={services}
        draft={draft}
        onDraftChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
        onSearch={onSearch}
        onReset={onReset}
      />

      <Paper elevation={3}>
        {loading ? (
          <Box p={3}>Chargement...</Box>
        ) : rows.length === 0 ? (
          <Box p={3}>Aucune convocation trouvée</Box>
        ) : (
          <ConvocationsTable rows={rows} />
        )}

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
