import { describe, expect, it } from "vitest";
import { nombreOuNull, parseNombre, validerMesure } from "./mesures";

describe("parseNombre", () => {
  it("accepte la virgule et le point décimal", () => {
    expect(parseNombre("36,5")).toBe(36.5);
    expect(parseNombre("36.5")).toBe(36.5);
    expect(parseNombre(" 120 ")).toBe(120);
  });

  it("renvoie null si vide, NaN si invalide", () => {
    expect(parseNombre("")).toBeNull();
    expect(parseNombre(undefined)).toBeNull();
    expect(parseNombre("12a")).toBeNaN();
    expect(parseNombre("1,2,3")).toBeNaN();
  });

  it("nombreOuNull ignore les saisies invalides", () => {
    expect(nombreOuNull("abc")).toBeNull();
    expect(nombreOuNull("7")).toBe(7);
  });
});

describe("validerMesure", () => {
  const pas = { min: 60, max: 260, integer: true };

  it("accepte une valeur vide (champ non obligatoire)", () => {
    expect(validerMesure("", pas)).toBeNull();
  });

  it("vérifie les bornes incluses", () => {
    expect(validerMesure("60", pas)).toBeNull();
    expect(validerMesure("260", pas)).toBeNull();
    expect(validerMesure("59", pas)).toBe("Minimum 60");
    expect(validerMesure("261", pas)).toBe("Maximum 260");
  });

  it("refuse un décimal quand un entier est attendu", () => {
    expect(validerMesure("120,5", pas)).toBe("Nombre entier attendu");
  });

  it("accepte un décimal quand c'est autorisé", () => {
    expect(validerMesure("37,8", { min: 34, max: 42 })).toBeNull();
    expect(validerMesure("0,2", { min: 0.2, max: 6 })).toBeNull();
    expect(validerMesure("0,1", { min: 0.2, max: 6 })).toBe("Minimum 0,20");
  });

  it("signale une saisie non numérique", () => {
    expect(validerMesure("abc", pas)).toBe("Nombre invalide");
  });
});
