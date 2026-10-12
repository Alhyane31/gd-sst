// Calculs et alertes des constantes (4.0) : IMC, tour de taille, pression artérielle
import { formatNombre, nombreOuNull, type Alerte, type Severite } from "./mesures";

export type Sexe = "H" | "F" | "" | null | undefined;

/** IMC = poids (kg) / taille (m)², arrondi à 0,1. null si une mesure manque. */
export function calculerIMC(poidsKg: unknown, tailleCm: unknown): number | null {
  const poids = nombreOuNull(poidsKg);
  const taille = nombreOuNull(tailleCm);
  if (!poids || !taille || poids <= 0 || taille <= 0) return null;
  const m = taille / 100;
  return Math.round((poids / (m * m)) * 10) / 10;
}

/** Interprétation OMS : < 18,5 maigreur ; 18,5–24,9 normal ; 25–29,9 surpoids ; ≥ 30 obésité */
export function interpreterIMC(imc: number): { libelle: string; severite: Severite } {
  if (imc < 18.5) return { libelle: "Maigreur", severite: "warning" };
  if (imc < 25) return { libelle: "Normal", severite: "success" };
  if (imc < 30) return { libelle: "Surpoids", severite: "warning" };
  return { libelle: "Obésité", severite: "error" };
}

/** Risque cardio-métabolique si tour de taille > 94 cm (H) ou > 80 cm (F) */
export function alerteTourDeTaille(tourCm: unknown, sexe: Sexe): Alerte | null {
  const tour = nombreOuNull(tourCm);
  if (tour === null) return null;
  if (sexe !== "H" && sexe !== "F") {
    return {
      severite: "info",
      message: "Renseignez le sexe (Informations générales) pour interpréter le tour de taille.",
    };
  }
  const seuil = sexe === "H" ? 94 : 80;
  if (tour > seuil) {
    return {
      severite: "warning",
      message: `Tour de taille ${formatNombre(tour)} cm > ${seuil} cm (${sexe === "H" ? "homme" : "femme"}) : risque cardio-métabolique.`,
    };
  }
  return null;
}

export type MesuresPA = {
  pasD?: unknown;
  padD?: unknown;
  pasG?: unknown;
  padG?: unknown;
};

/** Écart de PAS D/G ≥ 10 mmHg et PA ≥ 140/90 mmHg */
export function alertesPressionArterielle(pa: MesuresPA): Alerte[] {
  const alertes: Alerte[] = [];
  const pasD = nombreOuNull(pa.pasD);
  const pasG = nombreOuNull(pa.pasG);
  const padD = nombreOuNull(pa.padD);
  const padG = nombreOuNull(pa.padG);

  if (pasD !== null && pasG !== null) {
    const ecart = Math.abs(pasD - pasG);
    if (ecart >= 10) {
      alertes.push({
        severite: "warning",
        message: `Écart de PAS entre bras droit et gauche : ${ecart} mmHg (≥ 10 mmHg).`,
      });
    }
  }

  const pasMax = Math.max(...[pasD, pasG].filter((v): v is number => v !== null));
  const padMax = Math.max(...[padD, padG].filter((v): v is number => v !== null));
  if ((Number.isFinite(pasMax) && pasMax >= 140) || (Number.isFinite(padMax) && padMax >= 90)) {
    alertes.push({ severite: "warning", message: "PA ≥ 140/90 mmHg (valeur usuelle au cabinet < 140/90)." });
  }

  return alertes;
}

export type MesuresOrthostatisme = MesuresPA & {
  pas1?: unknown;
  pad1?: unknown;
  pas3?: unknown;
  pad3?: unknown;
};

/**
 * Hypotension orthostatique : baisse ≥ 20 mmHg de PAS ou ≥ 10 mmHg de PAD
 * à 1 ou 3 min debout, par rapport à la PA de repos (bras droit, sinon gauche).
 */
export function alerteOrthostatisme(m: MesuresOrthostatisme): Alerte | null {
  const pasRef = nombreOuNull(m.pasD) ?? nombreOuNull(m.pasG);
  const padRef = nombreOuNull(m.padD) ?? nombreOuNull(m.padG);

  const baisses: string[] = [];
  for (const [minute, pas, pad] of [
    [1, m.pas1, m.pad1],
    [3, m.pas3, m.pad3],
  ] as const) {
    const pasDebout = nombreOuNull(pas);
    const padDebout = nombreOuNull(pad);
    const dPas = pasRef !== null && pasDebout !== null ? pasRef - pasDebout : null;
    const dPad = padRef !== null && padDebout !== null ? padRef - padDebout : null;
    if ((dPas !== null && dPas >= 20) || (dPad !== null && dPad >= 10)) {
      baisses.push(`à ${minute} min : PAS −${dPas ?? "?"} / PAD −${dPad ?? "?"} mmHg`);
    }
  }

  if (baisses.length === 0) return null;
  return {
    severite: "error",
    message: `Hypotension orthostatique (baisse ≥ 20 mmHg de PAS ou ≥ 10 mmHg de PAD) ${baisses.join(" ; ")}.`,
  };
}
