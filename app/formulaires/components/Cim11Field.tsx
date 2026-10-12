"use client";

// Sélection d'un code CIM-11 : recherche (feuilles seules sélectionnables) + parcours du référentiel.
import { Autocomplete, CircularProgress, IconButton, Stack, TextField, Tooltip } from "@mui/material";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import { useEffect, useState } from "react";
import Cim11PickerDialog from "./Cim11PickerDialog";
import type { Cim11Option } from "./types";

const LEVEL_INDENT: Record<string, number> = { L1: 8, L2: 16, L3: 24, L4: 32, L5: 40 };

export type Cim11Value = { code: string; libelle: string } | null;

export default function Cim11Field({
  value,
  onChange,
  disabled = false,
  placeholder = "Rechercher une pathologie CIM-11",
}: {
  value: Cim11Value;
  onChange: (v: Cim11Value) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [search, setSearch] = useState<string | null>(null);
  const [options, setOptions] = useState<Cim11Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (search === null) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ pageSize: "20" });
        if (search.trim()) params.set("q", search.trim());
        const res = await fetch(`/api/cim11?${params}`, { signal: controller.signal });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.message ?? "Erreur chargement CIM-11");
        setOptions(
          (payload?.items ?? []).map((item: Cim11Option) => ({
            id: item.id,
            code: item.code,
            libelle: item.libelle,
            isLeaf: item.isLeaf,
            level: item.level,
          }))
        );
      } catch (e: unknown) {
        if ((e as Error)?.name !== "AbortError") setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flex: 1, minWidth: 260 }}>
      <Autocomplete<Cim11Option, false, false, false>
        sx={{ flex: 1 }}
        disabled={disabled}
        options={options}
        loading={loading}
        filterOptions={(x) => x}
        getOptionLabel={(o) => `${o.code} — ${o.libelle}`}
        isOptionEqualToValue={(a, b) => a.code === b.code}
        value={value ? { id: value.code, code: value.code, libelle: value.libelle, isLeaf: true, level: "" } : null}
        onInputChange={(_, v, reason) => {
          if (reason === "input" || reason === "clear") setSearch(v);
        }}
        onOpen={() => setSearch((s) => s ?? "")}
        onChange={(_, opt) => {
          if (!opt) return onChange(null);
          if (opt.isLeaf) onChange({ code: opt.code, libelle: opt.libelle });
        }}
        renderOption={(props, option) => (
          <li
            {...props}
            key={option.id}
            style={{
              paddingLeft: LEVEL_INDENT[option.level] ?? 8,
              opacity: option.isLeaf ? 1 : 0.85,
              pointerEvents: option.isLeaf ? "auto" : "none",
              fontSize: option.isLeaf ? "0.875rem" : "0.78rem",
              fontWeight: option.isLeaf ? 400 : 600,
              color: option.isLeaf ? "inherit" : "#666",
              borderTop: option.level === "L1" ? "1px solid #eee" : "none",
            }}
          >
            {option.code} — {option.libelle}
          </li>
        )}
        noOptionsText="Aucune pathologie trouvée"
        loadingText="Chargement..."
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            placeholder={placeholder}
            slotProps={{
              input: {
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />
      {!disabled && (
        <Tooltip title="Parcourir le référentiel CIM-11">
          <IconButton size="small" onClick={() => setPickerOpen(true)}>
            <ManageSearchIcon />
          </IconButton>
        </Tooltip>
      )}
      <Cim11PickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(item) => onChange({ code: item.code, libelle: item.libelle })}
      />
    </Stack>
  );
}
