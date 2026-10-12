"use client";

// Rend une section d'examen décrite en config (types.ts) : grilles, mesures, mobilités, EVA,
// choix, cases à cocher, listes, textes, pièces jointes, champs calculés et alertes.
import {
  Alert,
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
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
import { isVisible, pruneHidden } from "../engine";
import type { ExamCtx, FieldDef, SectionDef, SectionValues } from "../types";

const WIDE_KINDS = new Set(["grid", "mobility", "textarea", "checkboxes", "choice", "heading", "attachment", "eva"]);

export default function SectionRenderer({
  section,
  values,
  onChange,
  ctx,
  champPrefix,
}: {
  section: SectionDef;
  values: SectionValues | undefined;
  onChange: (next: SectionValues) => void;
  ctx: ExamCtx;
  /** préfixe des pièces jointes, ex. "examen" ou "paraclinique" */
  champPrefix: string;
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
          <ExamGrid
            label={f.label}
            rows={f.rows}
            columns={f.columns}
            help={f.help}
            readOnly={readOnly}
            value={v[f.id] as GridValue | undefined}
            onChange={(next) => set(f.id, Object.keys(next).length ? next : undefined)}
          />
        );

      case "measure":
        return (
          <MeasureInput
            label={f.label}
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
            <Typography variant="subtitle2" fontWeight={600}>
              {f.label}
            </Typography>
            <RadioGroup row value={(v[f.id] as string) ?? ""}>
              {f.options.map((o) => (
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
            <Typography variant="subtitle2" fontWeight={600}>
              {f.label}
            </Typography>
            <FormGroup row>
              {f.options.map((o) => (
                <FormControlLabel
                  key={o.value}
                  label={o.label}
                  disabled={readOnly}
                  control={<Checkbox size="small" checked={selected.includes(o.value)} onChange={() => toggle(o.value)} />}
                />
              ))}
            </FormGroup>
          </Box>
        );
      }

      case "select":
        return (
          <TextField
            select
            size="small"
            label={f.label}
            sx={{ width: 240 }}
            disabled={readOnly}
            helperText={f.help}
            value={(v[f.id] as string) ?? ""}
            onChange={(e) => set(f.id, e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {f.options.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        );

      case "text":
      case "date":
        return (
          <TextField
            size="small"
            type={f.kind === "date" ? "date" : "text"}
            label={f.label}
            sx={{ width: f.kind === "date" ? 200 : 320 }}
            disabled={readOnly}
            helperText={f.help}
            value={(v[f.id] as string) ?? ""}
            onChange={(e) => set(f.id, e.target.value)}
            slotProps={f.kind === "date" ? { inputLabel: { shrink: true } } : undefined}
          />
        );

      case "textarea":
        return (
          <TextField
            fullWidth
            multiline
            minRows={2}
            size="small"
            label={f.label}
            disabled={readOnly}
            helperText={f.help}
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
          <Box sx={{ minWidth: 240 }}>
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
            <Box key={f.id} sx={WIDE_KINDS.has(f.kind) ? { flexBasis: "100%" } : undefined}>
              {renderField(f)}
            </Box>
          ))}
      </Box>

      {alertes.length > 0 && (
        <Box mt={2}>
          <AlertList alertes={alertes} />
        </Box>
      )}
    </Box>
  );
}
