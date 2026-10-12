import { describe, expect, it } from "vitest";
import { AP } from "@/lib/clinique/antecedents";
import { isVisible, pruneHidden } from "../engine";
import { ANTECEDENTS_PROFESSIONNELS as S } from "./antecedentsProfessionnels";

const field = (id: string) => S.fields.find((f) => f.id === id)!;
const visibles = (values: Record<string, unknown>) =>
  S.fields.filter((f) => isVisible(f, values, {})).map((f) => f.id);

describe("antécédents professionnels : logique « si oui »", () => {
  it("n'affiche que les 5 questions Oui/Non au départ", () => {
    expect(visibles({})).toEqual([AP.AT, AP.MP, AP.TRAJET, AP.AMENAGEMENT, AP.RECLASSEMENT]);
  });

  it("« Oui » à l'accident de travail ouvre ses détails", () => {
    const v = visibles({ [AP.AT]: "OUI" });
    expect(v).toEqual(expect.arrayContaining([AP.AT_DATE, AP.AT_DECLARE, AP.AT_DETAILS, AP.AT_SEQUELLES]));
    expect(v).not.toContain(AP.AT_SEQUELLES_DETAILS);
  });

  it("les détails des séquelles n'apparaissent qu'avec séquelles = Oui", () => {
    expect(isVisible(field(AP.AT_SEQUELLES_DETAILS), { [AP.AT]: "OUI", [AP.AT_SEQUELLES]: "OUI" }, {})).toBe(true);
    expect(isVisible(field(AP.AT_SEQUELLES_DETAILS), { [AP.AT]: "OUI", [AP.AT_SEQUELLES]: "NON" }, {})).toBe(false);
  });

  it("maladie professionnelle : date de déclaration si déclarée, date de réparation si réparée", () => {
    expect(isVisible(field(AP.MP_DATE_DECLARATION), { [AP.MP]: "OUI", [AP.MP_DECLAREE]: "OUI" }, {})).toBe(true);
    expect(isVisible(field(AP.MP_DATE_DECLARATION), { [AP.MP]: "OUI", [AP.MP_DECLAREE]: "NON" }, {})).toBe(false);
    expect(isVisible(field(AP.MP_DATE_REPARATION), { [AP.MP]: "OUI", [AP.MP_REPAREE]: "OUI" }, {})).toBe(true);
  });

  it("accident de trajet : date de l'accident et date de déclaration présentes", () => {
    expect(isVisible(field(AP.TRAJET_DATE), { [AP.TRAJET]: "OUI" }, {})).toBe(true);
    expect(isVisible(field(AP.TRAJET_DATE_DECLARATION), { [AP.TRAJET]: "OUI", [AP.TRAJET_DECLARE]: "OUI" }, {})).toBe(true);
  });

  it("repasser à « Non » efface les détails saisis", () => {
    const values = { [AP.AT]: "NON", [AP.AT_DATE]: "2024-01-01", [AP.AT_SEQUELLES]: "OUI", [AP.AT_SEQUELLES_DETAILS]: "x" };
    expect(pruneHidden(S, values, {})).toEqual({ [AP.AT]: "NON" });
  });
});
