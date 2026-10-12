"use client";

import { Typography } from "@mui/material";
import SectionRenderer from "@/app/formulaires/examen/components/SectionRenderer";
import { CONSTANTES } from "@/app/formulaires/examen/config/constantes";
import type { ExamCtx } from "@/app/formulaires/examen/types";
import type { ChangeHandler, FormData } from "../types";

export default function ConstantesSection({
  data,
  onChange,
  ctx,
}: {
  data: FormData;
  onChange: ChangeHandler;
  ctx: ExamCtx;
}) {
  return (
    <>
      <Typography variant="h6" mb={1}>
        {CONSTANTES.title}
      </Typography>
      <SectionRenderer
        section={CONSTANTES}
        champPrefix="examen"
        ctx={ctx}
        values={data.examen?.[CONSTANTES.id]}
        onChange={(next) => onChange("examen", { ...(data.examen ?? {}), [CONSTANTES.id]: next })}
      />
    </>
  );
}
