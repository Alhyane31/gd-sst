"use client";

// Annexes A à G (référentiel paramétrable) : aides de référence, affichées et imprimées telles quelles.
import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import type { ReferentielAes } from "@/lib/aes/referentiel";

type Cle = keyof ReferentielAes["annexes"];

export function AnnexeTable({ referentiel, cle }: { referentiel: ReferentielAes; cle: Cle }) {
  const a = referentiel.annexes[cle];
  if (!a) return null;
  return (
    <Box mb={3} sx={{ breakInside: "avoid" }}>
      <Typography variant="subtitle1" fontWeight={700} mb={1}>
        {a.titre}
      </Typography>
      <Paper variant="outlined" sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {a.entetes.map((e) => (
                <TableCell key={e} sx={{ fontWeight: 700 }}>
                  {e}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {a.lignes.map((l, i) => (
              <TableRow key={i}>
                {l.map((c, j) => (
                  <TableCell key={j}>{c}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      {a.notes?.map((n) => (
        <Typography key={n} variant="caption" color="text.secondary" display="block" mt={0.5}>
          {n}
        </Typography>
      ))}
    </Box>
  );
}

/** Schémas de TPE paramétrés (annexe B, liste du champ 53) */
export function SchemasTpe({ referentiel }: { referentiel: ReferentielAes }) {
  return (
    <Box mb={3} sx={{ breakInside: "avoid" }}>
      <Typography variant="subtitle1" fontWeight={700} mb={1}>
        Schémas de TPE VIH (protocole du P23, paramétrable)
      </Typography>
      <Paper variant="outlined" sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Schéma</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Molécules</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Remarques</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {referentiel.schemasTpe.map((s) => (
              <TableRow key={s.code} sx={s.actif ? undefined : { color: "text.disabled", "& td": { color: "text.disabled" } }}>
                <TableCell>{s.libelle}</TableCell>
                <TableCell>{s.molecules}</TableCell>
                <TableCell>
                  {s.remarques}
                  {!s.actif && " (non proposé)"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

export default function Annexes({ referentiel, cles = ["A", "B", "C", "D", "E", "F", "G"] }: { referentiel: ReferentielAes; cles?: Cle[] }) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Aides à la décision issues du cours AES du service. Le protocole du P23 et les recommandations nationales priment ;
        ces tableaux sont paramétrables (Référentiels → AES).
      </Typography>
      {cles.map((c) => (
        <Box key={c}>
          <AnnexeTable referentiel={referentiel} cle={c} />
          {c === "B" && <SchemasTpe referentiel={referentiel} />}
        </Box>
      ))}
    </Box>
  );
}
