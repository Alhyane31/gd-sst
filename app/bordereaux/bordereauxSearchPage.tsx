// app/bordereaux/page.tsx
"use client";

import { Box, Button, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import BordereauxSearchFilters, { BordereauxFilters } from "./components/BordereauxSearchFilters";
import BordereauxTable, { BordereauRow } from "./components/BordereauxTable";
import CreateBordereauDialog from "./components/CreateBordereauDialog";

type FormationMini = { id: string; libelle: string };
type ApiList<T> = { items: T[]; total: number; page: number; pageSize: number };

export default function BordereauxPage() {
  const router = useRouter();
  const { status } = useSession();

  const [formations, setFormations] = useState<FormationMini[]>([]);

  const [filters, setFilters] = useState<BordereauxFilters>({
    formationId: "",
    serviceId: "",
    statut: "",
    dateFrom: "",
    dateTo: "",
    q: "",
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [items, setItems] = useState<BordereauRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [openCreate, setOpenCreate] = useState(false);

  // ✅ formations
  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/formations")
      .then((r) => r.json())
      .then((data) => setFormations(Array.isArray(data) ? data : data.items ?? []))
      .catch(() => setFormations([]));
  }, [status]);

  const fetchBordereaux = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (filters.formationId) params.set("formationId", filters.formationId);
      if (filters.serviceId) params.set("serviceId", filters.serviceId);

      if (filters.statut) params.set("statut", filters.statut);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.q) params.set("q", filters.q);

      params.set("page", String(page));
      params.set("pageSize", String(rowsPerPage));

      const res = await fetch(`/api/bordereaux?${params.toString()}`);
      if (!res.ok) {
        setItems([]);
        setTotal(0);
        return;
      }

      const data: ApiList<any> = await res.json();

      const rows: BordereauRow[] = (data.items ?? []).map((b: any) => ({
        id: b.id,
        serialNumber: b.serialNumber,
        statut: b.statut,
        dateEdition: b.dateEdition,
        service: b.service ? { id: b.service.id, libelle: b.service.libelle } : null,
        nbConvocations: b._count?.convocations ?? 0,
      }));

      setItems(rows);
      setTotal(data.total ?? 0);
    } catch (e) {
      console.error("fetch bordereaux error", e);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, page, rowsPerPage]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchBordereaux();
  }, [status, fetchBordereaux]);

  const onApplyFilters = (next: BordereauxFilters) => {
    setFilters(next);
    setPage(0);
  };

  const handleGenerate = async (id: string) => {
    if (!confirm("Générer ce bordereau ?")) return;

    const res = await fetch(`/api/bordereaux/${id}/generate`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Erreur génération");
      return;
    }
    await fetchBordereaux();
    alert("Bordereau généré.");
  };

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Bordereaux</Typography>

        <Button variant="contained" onClick={() => setOpenCreate(true)}>
          Créer bordereau
        </Button>
      </Box>

      <BordereauxSearchFilters
        formations={formations}
        value={filters}
        onChange={onApplyFilters}
        onReset={() =>
          onApplyFilters({
            formationId: "",
            serviceId: "",
            statut: "",
            dateFrom: "",
            dateTo: "",
            q: "",
          })
        }
      />

      <BordereauxTable
        rows={items}
        loading={loading}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(n) => {
          setRowsPerPage(n);
          setPage(0);
        }}
        onView={(id) => router.push(`/bordereaux/${id}`)}
        onEdit={(id) => router.push(`/bordereaux/${id}/edit`)}
        onGenerate={handleGenerate}
      />

      <CreateBordereauDialog
  open={openCreate}
  onClose={() => setOpenCreate(false)}
  formations={formations}
  onCreated={() => {
    setOpenCreate(false);
    fetchBordereaux();
  }}
/>

    </Box>
  );
}
