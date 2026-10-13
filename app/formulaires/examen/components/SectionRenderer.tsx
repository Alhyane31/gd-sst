"use client";

// Rend une section d'examen décrite en config (types.ts) : grilles, mesures, mobilités, EVA,
// choix, cases à cocher, listes, textes, pièces jointes, champs calculés et alertes.
import {
  Alert,
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Link,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import AlertList from "./AlertList";
import AttachmentField from "./AttachmentField";
import EvaScale from "./EvaScale";
import ExamGrid, { type GridValue } from "./ExamGrid";
import MeasureInput from "./MeasureInput";
import MobilityTable, { type MobilityValue } from "./MobilityTable";
import { isRequired, isVisible, pruneHidden, resolveOptions, visibleRows } from "../engine";
import type { ExamCtx, FieldDef, SectionDef, SectionValues } from "../types";

const WIDE_KINDS = new Set(["grid", "mobility", "textarea", "checkboxes", "choice", "heading", "attachment", "eva"]);

// Champs courts (mesures, listes, textes, dates…) : deux par ligne, un seul sur écran étroit.
// La largeur laisse la place au libellé et à l'unité sans chevauchement.
const DEMI_LIGNE = { width: { xs: "100%", md: "calc(50% - 8px)" } };

export default function SectionRenderer({
  section,
  values,
  onChange,
  ctx,
  champPrefix,
  missing = [],
}: {
  section: SectionDef;
  values: SectionValues | undefined;
  onChange: (next: SectionValues) => void;
  ctx: ExamCtx;
  /** préfixe des pièces jointes, ex. "examen" ou "paraclinique" */
  champPrefix: string;
  /** champs obligatoires non renseignés, mis en évidence après une tentative de validation */
  missing?: string[];
}) {
  const v = values ?? {};
  const readOnly = !!ctx.readOnly;

  // à chaque saisie, les champs devenus masqués (condition « si oui ») sont vidés
  const set = (id: string, value: unknown) => {
    const next: SectionValues = { ...v };
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) delete next[id];
    else next[id] = value;
    onChange(pruneHidden(section, next, ctx));
  };

  const alertes = section.alerts ? section.alerts(v, ctx) : [];

  // suggestion acceptée par l'utilisateur : ses valeurs sont appliquées (toujours modifiables ensuite)
  const appliquer = (valeurs: Record<string, unknown>) => onChange(pruneHidden(section, { ...v, ...valeurs }, ctx));

  const manquant = (id: string) => missing.includes(id);
  const libelle = (f: FieldDef) => `${f.label}${isRequired(f, v, ctx) ? " *" : ""}`;
  const obligatoire = (id: string) =>
    manquant(id) ? (
      <Typography variant="caption" color="error" display="block">
        Obligatoire
      </Typography>
    ) : null;

  const renderField = (f: FieldDef) => {
    switch (f.kind) {
      case "heading":
        return (
          <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mt: 1 }}>
            {f.label}
          </Typography>
        );

      case "grid":
        return (
          <>
          <ExamGrid
            label={libelle(f)}
            rows={visibleRows(f, v, ctx)}
            columns={f.columns}
            help={f.help}
            readOnly={readOnly}
            value={v[f.id] as GridValue | undefined}
            onChange={(next) => set(f.id, Object.keys(next).length ? next : undefined)}
          />
          {obligatoire(f.id)}
          </>
        );

      case "measure":
        return (
          <MeasureInput
            width="100%"
            label={libelle(f)}
            unit={f.unit}
            min={f.min}
            max={f.max}
            integer={f.integer}
            help={f.help}
            readOnly={readOnly}
            value={v[f.id]}
            onChange={(next) => set(f.id, next)}
          />
        );

      case "mobility":
        return (
          <MobilityTable
            label={f.label}
            movements={f.movements}
            mode={f.mode}
            max={f.max}
            readOnly={readOnly}
            value={v[f.id] as MobilityValue | undefined}
            onChange={(next) => set(f.id, next)}
          />
        );

      case "eva":
        return <EvaScale label={f.label} readOnly={readOnly} value={v[f.id]} onChange={(next) => set(f.id, next)} />;

      case "choice":
        return (
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color={manquant(f.id) ? "error" : undefined}>
              {libelle(f)}
            </Typography>
            <RadioGroup row value={(v[f.id] as string) ?? ""}>
              {resolveOptions(f, ctx).map((o) => (
                <FormControlLabel
                  key={o.value}
                  value={o.value}
                  label={o.label}
                  disabled={readOnly}
                  control={
                    <Radio
                      size="small"
                      // recliquer sur la réponse cochée l'efface (champ non obligatoire)
                      onClick={() => set(f.id, v[f.id] === o.value ? undefined : o.value)}
                    />
                  }
                />
              ))}
            </RadioGroup>
            {f.help && (
              <Typography variant="caption" color="text.secondary">
                {f.help}
              </Typography>
            )}
            {obligatoire(f.id)}
          </Box>
        );

      case "checkboxes": {
        const selected = Array.isArray(v[f.id]) ? (v[f.id] as string[]) : [];
        const toggle = (value: string) => {
          if (selected.includes(value)) return set(f.id, selected.filter((s) => s !== value));
          if (value === f.exclusive) return set(f.id, [value]);
          return set(f.id, [...selected.filter((s) => s !== f.exclusive), value]);
        };
        return (
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color={manquant(f.id) ? "error" : undefined}>
              {libelle(f)}
            </Typography>
            <FormGroup row>
              {resolveOptions(f, ctx).map((o) => (
                <FormControlLabel
                  key={o.value}
                  label={o.label}
                  disabled={readOnly}
                  control={<Checkbox size="small" checked={selected.includes(o.value)} onChange={() => toggle(o.value)} />}
                />
              ))}
            </FormGroup>
            {f.help && (
              <Typography variant="caption" color="text.secondary">
                {f.help}
              </Typography>
            )}
            {obligatoire(f.id)}
          </Box>
        );
      }

      case "select":
        return (
          <TextField
            select
            size="small"
            label={libelle(f)}
            fullWidth
            disabled={readOnly}
            error={manquant(f.id)}
            helperText={manquant(f.id) ? "Obligatoire" : f.help}
            value={(v[f.id] as string) ?? ""}
            onChange={(e) => set(f.id, e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {resolveOptions(f, ctx).map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        );

      case "text":
      case "date":
      case "time":
      case "datetime": {
        const type = { text: "text", date: "date", time: "time", datetime: "datetime-local" }[f.kind];
        return (
          <TextField
            size="small"
            type={type}
            label={libelle(f)}
            fullWidth
            disabled={readOnly}
            error={manquant(f.id)}
            helperText={manquant(f.id) ? "Obligatoire" : f.help}
            value={(v[f.id] as string) ?? ""}
            onChange={(e) => set(f.id, e.target.value)}
            slotProps={f.kind !== "text" ? { inputLabel: { shrink: true } } : undefined}
          />
        );
      }

      case "textarea":
        return (
          <TextField
            fullWidth
            multiline
            minRows={2}
            size="small"
            label={libelle(f)}
            disabled={readOnly}
            error={manquant(f.id)}
            helperText={manquant(f.id) ? "Obligatoire" : f.help}
            value={(v[f.id] as string) ?? ""}
            onChange={(e) => set(f.id, e.target.value)}
          />
        );

      case "attachment":
        return (
          <AttachmentField
            label={f.label}
            help={f.help}
            champ={`${champPrefix}.${section.id}.${f.id}`}
            visiteId={ctx.visiteId}
            readOnly={readOnly}
            value={v[f.id]}
            onChange={(next) => set(f.id, next)}
          />
        );

      case "computed": {
        const result = f.compute(v, ctx);
        return (
          <Box>
            <Typography variant="caption" color="text.secondary">
              {f.label}
            </Typography>
            {result ? (
              <Alert severity={result.severite ?? "info"} sx={{ py: 0 }}>
                {result.text}
              </Alert>
            ) : (
              <Typography variant="body2" color="text.secondary">
                — {f.help ?? "calculé automatiquement"}
              </Typography>
            )}
          </Box>
        );
      }
    }
  };

  return (
    <Box>
      {section.intro && (
        <Typography variant="body2" color="text.secondary" mb={2}>
          {section.intro}
        </Typography>
      )}

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-start" }}>
        {section.fields
          .filter((f) => isVisible(f, v, ctx))
          .map((f) => (
            <Box key={f.id} sx={WIDE_KINDS.has(f.kind) ? { flexBasis: "100%" } : DEMI_LIGNE}>
              {renderField(f)}
              {f.kind !== "heading" && f.aide && ctx.onAide && (
                <Link component="button" type="button" variant="caption" onClick={() => ctx.onAide!(f.aide!)} sx={{ display: "block", mt: 0.25 }}>
                  Voir l&apos;annexe {f.aide}
                </Link>
              )}
            </Box>
          ))}
      </Box>

      {alertes.length > 0 && (
        <Box mt={2}>
          <AlertList alertes={alertes} onApply={readOnly ? undefined : appliquer} />
        </Box>
      )}
    </Box>
  );
}
