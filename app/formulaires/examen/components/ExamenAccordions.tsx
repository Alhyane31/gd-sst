"use client";

// Liste de sections d'examen en accordéons, avec badges « n anomalies » et « alerte ».
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { countAnomalies, visibleSections } from "../engine";
import type { ExamCtx, SectionDef, SectionValues } from "../types";
import SectionRenderer from "./SectionRenderer";

export default function ExamenAccordions({
  groupes,
  values,
  onChange,
  ctx,
  champPrefix,
}: {
  groupes: { groupe: string; sections: SectionDef[] }[];
  values: Record<string, SectionValues> | undefined;
  onChange: (next: Record<string, SectionValues>) => void;
  ctx: ExamCtx;
  champPrefix: string;
}) {
  const all = values ?? {};

  return (
    <Box>
      {groupes.map(({ groupe, sections }) => {
        const visibles = visibleSections(sections, ctx);
        if (visibles.length === 0) return null;
        return (
          <Box key={groupe} mb={2}>
            <Typography variant="overline" color="text.secondary" fontWeight={700}>
              {groupe}
            </Typography>
            {visibles.map((s) => {
              const v = all[s.id] ?? {};
              const anomalies = countAnomalies(s, v, ctx);
              const alertes = s.alerts ? s.alerts(v, ctx).filter((a) => a.severite === "error" || a.severite === "warning") : [];
              const renseigne = Object.keys(v).length > 0;
              return (
                <Accordion key={s.id} disableGutters slotProps={{ transition: { unmountOnExit: true } }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography fontWeight={600}>{s.title}</Typography>
                      {!renseigne && <Chip size="small" label="Non renseigné" variant="outlined" />}
                      {anomalies > 0 && (
                        <Chip size="small" color="warning" label={`${anomalies} anomalie${anomalies > 1 ? "s" : ""}`} />
                      )}
                      {alertes.length > 0 && (
                        <Chip
                          size="small"
                          color={alertes.some((a) => a.severite === "error") ? "error" : "warning"}
                          icon={<WarningAmberIcon />}
                          label={`Alerte${alertes.length > 1 ? "s" : ""}`}
                        />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <SectionRenderer
                      section={s}
                      champPrefix={champPrefix}
                      ctx={ctx}
                      values={v}
                      onChange={(next) => onChange({ ...all, [s.id]: next })}
                    />
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}
