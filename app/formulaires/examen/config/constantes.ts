// 4.0 Constantes — à saisir avant tout examen. PA en mmHg (12/8 cmHg = 120/80 mmHg).
import {
  alerteOrthostatisme,
  alertesPressionArterielle,
  alerteTourDeTaille,
  calculerIMC,
  interpreterIMC,
} from "@/lib/clinique/constantes";
import { formatNombre, type Alerte } from "@/lib/clinique/mesures";
import type { SectionDef, SectionValues } from "../types";
import { opts } from "./presets";

/** Une case cochée (malaise, vertiges, antihypertenseur) déclenche la PA debout à 1 et 3 min */
export const indicationOrthostatisme = (v: SectionValues) =>
  Array.isArray(v.indicationOrthostatisme) && v.indicationOrthostatisme.length > 0;

export const CONSTANTES: SectionDef = {
  id: "constantes",
  title: "Constantes",
  intro: "À saisir avant tout examen. Pression artérielle en mmHg (12/8 cmHg = 120/80 mmHg).",
  fields: [
    { kind: "heading", id: "h_pa", label: "Pression artérielle" },
    { kind: "measure", id: "pasD", label: "PA systolique, bras droit", unit: "mmHg", integer: true, min: 60, max: 260, help: "Usuel < 140 mmHg (cabinet)" },
    { kind: "measure", id: "padD", label: "PA diastolique, bras droit", unit: "mmHg", integer: true, min: 30, max: 150, help: "Usuel < 90 mmHg" },
    { kind: "measure", id: "pasG", label: "PA systolique, bras gauche", unit: "mmHg", integer: true, min: 60, max: 260, help: "Écart D/G usuel < 10 mmHg" },
    { kind: "measure", id: "padG", label: "PA diastolique, bras gauche", unit: "mmHg", integer: true, min: 30, max: 150 },
    {
      kind: "choice",
      id: "positionMesure",
      label: "Position et conditions de mesure",
      options: opts(["ASSIS_REPOS", "Assis après 5 min de repos"], ["COUCHE", "Couché"], ["DEBOUT", "Debout"]),
    },
    {
      kind: "checkboxes",
      id: "indicationOrthostatisme",
      label: "Mesure de la PA debout indiquée (malaise, vertiges, traitement antihypertenseur)",
      options: opts(["MALAISE", "Malaise"], ["VERTIGES", "Vertiges"], ["ANTIHYPERTENSEUR", "Traitement antihypertenseur"]),
    },
    { kind: "measure", id: "pas1", label: "PAS debout à 1 min", unit: "mmHg", integer: true, min: 60, max: 260, showIf: indicationOrthostatisme },
    { kind: "measure", id: "pad1", label: "PAD debout à 1 min", unit: "mmHg", integer: true, min: 30, max: 150, showIf: indicationOrthostatisme },
    { kind: "measure", id: "pas3", label: "PAS debout à 3 min", unit: "mmHg", integer: true, min: 60, max: 260, showIf: indicationOrthostatisme },
    {
      kind: "measure",
      id: "pad3",
      label: "PAD debout à 3 min",
      unit: "mmHg",
      integer: true,
      min: 30,
      max: 150,
      showIf: indicationOrthostatisme,
      help: "Hypotension orthostatique si baisse ≥ 20 (PAS) ou ≥ 10 mmHg (PAD)",
    },

    { kind: "heading", id: "h_autres", label: "Autres constantes" },
    { kind: "measure", id: "fc", label: "Fréquence cardiaque", unit: "bpm", integer: true, min: 30, max: 220, help: "Usuel 60–100 bpm" },
    { kind: "choice", id: "pouls", label: "Pouls", options: opts(["REGULIER", "Régulier", true], ["IRREGULIER", "Irrégulier"]) },
    { kind: "measure", id: "fr", label: "Fréquence respiratoire", unit: "cycles/min", integer: true, min: 5, max: 60, help: "Usuel 12–20 cycles/min" },
    { kind: "measure", id: "spo2", label: "SpO2, air ambiant", unit: "%", integer: true, min: 70, max: 100, help: "Usuel ≥ 95 %" },
    { kind: "measure", id: "temperature", label: "Température", unit: "°C", min: 34, max: 42, help: "Usuel 36,1–37,8 °C" },
    {
      kind: "measure",
      id: "glycemie",
      label: "Glycémie capillaire",
      unit: "g/L",
      min: 0.2,
      max: 6,
      help: "À jeun 0,70–1,10 g/L ; postprandiale < 1,40 g/L (1 g/L = 5,55 mmol/L)",
    },
    {
      kind: "choice",
      id: "glycemieConditions",
      label: "Conditions de la glycémie",
      options: opts(["A_JEUN", "À jeun"], ["POSTPRANDIALE", "Postprandiale (2 h)"], ["ALEATOIRE", "Aléatoire"]),
    },
    { kind: "eva", id: "evaGlobale", label: "Douleur globale (EVA)" },

    { kind: "heading", id: "h_poids", label: "Poids et taille" },
    { kind: "measure", id: "poids", label: "Poids", unit: "kg", min: 30, max: 250 },
    { kind: "measure", id: "taille", label: "Taille", unit: "cm", integer: true, min: 120, max: 220 },
    {
      kind: "computed",
      id: "imc",
      label: "IMC (calculé)",
      help: "renseignez poids et taille",
      compute: (v) => {
        const imc = calculerIMC(v.poids, v.taille);
        if (imc === null) return null;
        const { libelle, severite } = interpreterIMC(imc);
        return { text: `${formatNombre(imc)} kg/m² — ${libelle}`, severite };
      },
    },
    { kind: "measure", id: "tourTaille", label: "Tour de taille", unit: "cm", integer: true, min: 40, max: 200, help: "Risque si > 94 cm (H), > 80 cm (F)" },
  ],

  alerts: (v, ctx) => {
    const alertes: Alerte[] = [...alertesPressionArterielle(v)];
    if (indicationOrthostatisme(v)) {
      const ortho = alerteOrthostatisme(v);
      if (ortho) alertes.push(ortho);
    }
    const taille = alerteTourDeTaille(v.tourTaille, ctx.sexe as "H" | "F" | "");
    if (taille) alertes.push(taille);
    return alertes;
  },
};
