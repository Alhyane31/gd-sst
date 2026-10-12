import { describe, expect, it } from "vitest";
import { isVisible, sectionErrors } from "../engine";
import type { ComputedFieldDef } from "../types";
import { CONSTANTES } from "./constantes";

const field = (id: string) => CONSTANTES.fields.find((f) => f.id === id)!;
const imc = field("imc") as ComputedFieldDef;

describe("4.0 Constantes", () => {
  it("la PA debout n'apparaît que si une indication est cochée", () => {
    expect(isVisible(field("pas1"), {}, {})).toBe(false);
    expect(isVisible(field("pas1"), { indicationOrthostatisme: ["VERTIGES"] }, {})).toBe(true);
    expect(isVisible(field("pad3"), { indicationOrthostatisme: ["ANTIHYPERTENSEUR"] }, {})).toBe(true);
  });

  it("calcule et interprète l'IMC automatiquement", () => {
    expect(imc.compute({ poids: "70", taille: "175" }, {})).toEqual({ text: "22,9 kg/m² — Normal", severite: "success" });
    expect(imc.compute({ poids: "95", taille: "175" }, {})?.text).toBe("31 kg/m² — Obésité");
    expect(imc.compute({ poids: "70" }, {})).toBeNull();
  });

  it("valide les bornes du PDF (PAS 60–260 entier, température 34–42 décimal)", () => {
    const e = sectionErrors(CONSTANTES, { pasD: "300", temperature: "37,5", fc: "72,5", spo2: "101" });
    expect(e.pasD).toBe("Maximum 260");
    expect(e.temperature).toBeUndefined();
    expect(e.fc).toBe("Nombre entier attendu");
    expect(e.spo2).toBe("Maximum 100");
  });

  it("alerte écart D/G de PAS ≥ 10 mmHg", () => {
    const a = CONSTANTES.alerts!({ pasD: "120", padD: "75", pasG: "132", padG: "75" }, {});
    expect(a.map((x) => x.message).join()).toContain("Écart de PAS");
  });

  it("alerte d'hypotension orthostatique seulement si la mesure debout est indiquée", () => {
    const mesures = { pasD: "130", padD: "80", pas1: "105", pad1: "78" };
    expect(CONSTANTES.alerts!(mesures, {}).some((a) => a.message.includes("orthostatique"))).toBe(false);
    expect(
      CONSTANTES.alerts!({ ...mesures, indicationOrthostatisme: ["MALAISE"] }, {}).some((a) => a.message.includes("orthostatique"))
    ).toBe(true);
  });

  it("alerte tour de taille selon le sexe de la visite", () => {
    expect(CONSTANTES.alerts!({ tourTaille: "85" }, { sexe: "F" })).toHaveLength(1);
    expect(CONSTANTES.alerts!({ tourTaille: "85" }, { sexe: "H" })).toHaveLength(0);
  });
});
