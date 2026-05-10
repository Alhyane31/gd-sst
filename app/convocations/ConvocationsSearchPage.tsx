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
    serviceIds: [],
    categorie: "",

    visiteType: "",
    statuts: [],
    convocationType: "",
    presence: "",
    etat: "",

    dateConvocFrom: "",
    dateConvocTo: "",
    datePrevueFrom: "",
    datePrevueTo: "",
    dateVisiteRealiseeFrom: "",
    dateVisiteRealiseeTO: "",
  };

  const defaultFilters: ConvocationsFilters = { ...empty, statuts: ["ENVOYEE"] };

  const [draft, setDraft] = useState<ConvocationsFilters>(defaultFilters);
  const [applied, setApplied] = useState<ConvocationsFilters>(defaultFilters);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("datePrevue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [rows, setRows] = useState<ConvocationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCanceling, setBulkCanceling] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/postes").then((r) => r.json()).then(setPostes);
    fetch("/api/formations").then((r) => r.json()).then(setFormations);
  }, [status]);

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

  const fetchConvocations = useCallback(async (
    f: ConvocationsFilters,
    p: number,
    size: number,
    by: string,
    order: "asc" | "desc",
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (f.nom) params.set("nom", f.nom);
      if (f.prenom) params.set("prenom", f.prenom);
      if (f.posteId) params.set("posteId", f.posteId);
      if (f.formationId) params.set("formationId", f.formationId);
      if (f.serviceIds.length) params.set("serviceIds", f.serviceIds.join(","));
      if (f.categorie) params.set("categorie", f.categorie);

      if (f.convocationType) params.set("convocationType", f.convocationType);
      if (f.statuts.length) params.set("statuts", f.statuts.join(","));
      if (f.presence) params.set("presence", f.presence);
      if (f.etat) params.set("etat", f.etat);

      if (f.dateConvocFrom) params.set("dateConvocFrom", f.dateConvocFrom);
      if (f.dateConvocTo) params.set("dateConvocTo", f.dateConvocTo);
      if (f.datePrevueFrom) params.set("datePrevueFrom", f.datePrevueFrom);
      if (f.datePrevueTo) params.set("datePrevueTo", f.datePrevueTo);
      if (f.dateVisiteRealiseeFrom) params.set("dateVisiteRealiseeFrom", f.dateVisiteRealiseeFrom);
      if (f.dateVisiteRealiseeTO) params.set("dateVisiteRealiseeTO", f.dateVisiteRealiseeTO);

      params.set("page", String(p));
      params.set("pageSize", String(size));
      params.set("orderBy", by);
      params.set("orderDir", order);

      const res = await fetch(`/api/convocations?${params.toString()}`);

      if (res.status === 401) { signIn(); return; }
      if (!res.ok) { setRows([]); setTotal(0); return; }

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
    fetchConvocations(applied, page, rowsPerPage, sortBy, sortOrder);
  }, [status, applied, page, rowsPerPage, sortBy, sortOrder, fetchConvocations]);

  useEffect(() => { setSelectedIds([]); }, [applied, page]);

  const onSearch = () => { setApplied(draft); setPage(0); };

  const onReset = () => {
    setDraft(empty);
    setApplied(empty);
    setServices([]);
    setPage(0);
  };

  const handleSortChange = (field: string, order: "asc" | "desc") => {
    setSortBy(field);
    setSortOrder(order);
    setPage(0);
  };

  const toggleOne = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleAll = () => {
    const idsOnPage = rows.map((r) => r.id);
    const allSelected = idsOnPage.length > 0 && idsOnPage.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) => {
      if (allSelected) return prev.filter((id) => !idsOnPage.includes(id));
      const set = new Set(prev);
      idsOnPage.forEach((id) => set.add(id));
      return Array.from(set);
    });
  };

  const clearSelection = () => setSelectedIds([]);

  const handleBulkCancel = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Annuler ${selectedIds.length} convocation(s) sélectionnée(s) ?`)) return;
    setBulkCanceling(true);
    try {
      const res = await fetch("/api/convocations/bulk-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) { alert("Erreur lors de l'annulation groupée"); return; }
      setSelectedIds([]);
      fetchConvocations(applied, page, rowsPerPage, sortBy, sortOrder);
    } catch {
      alert("Erreur réseau");
    } finally {
      setBulkCanceling(false);
    }
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
          <ConvocationsTable
            rows={rows}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            selectedIds={selectedIds}
            onToggleOne={toggleOne}
            onToggleAll={toggleAll}
            onClearSelection={clearSelection}
            onBulkCancel={handleBulkCancel}
            bulkCanceling={bulkCanceling}
          />
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
