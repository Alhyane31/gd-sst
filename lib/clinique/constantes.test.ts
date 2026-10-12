import { describe, expect, it } from "vitest";
import {
  alerteOrthostatisme,
  alertesPressionArterielle,
  alerteTourDeTaille,
  calculerIMC,
  interpreterIMC,
} from "./constantes";

describe("IMC", () => {
  it("calcule poids / taille² arrondi à 0,1", () => {
    expect(calculerIMC("70", "175")).toBe(22.9);
    expect(calculerIMC("70,5", "175")).toBe(23); // virgule décimale acceptée
  });

  it("renvoie null si une mesure manque ou est invalide", () => {
    expect(calculerIMC("", "175")).toBeNull();
    expect(calculerIMC("70", "")).toBeNull();
    expect(calculerIMC("70", "0")).toBeNull();
    expect(calculerIMC("abc", "175")).toBeNull();
  });

  it("interprète selon les seuils OMS", () => {
    expect(interpreterIMC(18.4).libelle).toBe("Maigreur");
    expect(interpreterIMC(18.5).libelle).toBe("Normal");
    expect(interpreterIMC(24.9).libelle).toBe("Normal");
    expect(interpreterIMC(25).libelle).toBe("Surpoids");
    expect(interpreterIMC(29.9).libelle).toBe("Surpoids");
    expect(interpreterIMC(30).libelle).toBe("Obésité");
  });
});

describe("Tour de taille", () => {
  it("alerte au-delà de 94 cm chez l'homme", () => {
    expect(alerteTourDeTaille("94", "H")).toBeNull();
    expect(alerteTourDeTaille("95", "H")?.severite).toBe("warning");
  });

  it("alerte au-delà de 80 cm chez la femme", () => {
    expect(alerteTourDeTaille("80", "F")).toBeNull();
    expect(alerteTourDeTaille("81", "F")?.severite).toBe("warning");
  });

  it("demande le sexe s'il n'est pas renseigné", () => {
    expect(alerteTourDeTaille("100", "")?.severite).toBe("info");
  });

  it("ne dit rien sans mesure", () => {
    expect(alerteTourDeTaille("", "H")).toBeNull();
  });
});

describe("Pression artérielle", () => {
  it("alerte si l'écart de PAS D/G est ≥ 10 mmHg", () => {
    const a = alertesPressionArterielle({ pasD: "120", padD: "80", pasG: "130", padG: "80" });
    expect(a.some((x) => x.message.includes("Écart"))).toBe(true);
  });

  it("pas d'alerte d'écart sous 10 mmHg", () => {
    const a = alertesPressionArterielle({ pasD: "120", padD: "80", pasG: "129", padG: "80" });
    expect(a).toHaveLength(0);
  });

  it("alerte si PA ≥ 140/90", () => {
    expect(alertesPressionArterielle({ pasD: "140", padD: "80" }).length).toBe(1);
    expect(alertesPressionArterielle({ pasD: "130", padD: "90" }).length).toBe(1);
    expect(alertesPressionArterielle({ pasD: "139", padD: "89" }).length).toBe(0);
  });

  it("ignore les bras non mesurés", () => {
    expect(alertesPressionArterielle({ pasD: "120" })).toHaveLength(0);
    expect(alertesPressionArterielle({})).toHaveLength(0);
  });
});

describe("Hypotension orthostatique", () => {
  const repos = { pasD: "130", padD: "80" };

  it("détecte une baisse de PAS ≥ 20 mmHg", () => {
    expect(alerteOrthostatisme({ ...repos, pas1: "110", pad1: "78" })?.severite).toBe("error");
  });

  it("détecte une baisse de PAD ≥ 10 mmHg à 3 min", () => {
    const a = alerteOrthostatisme({ ...repos, pas1: "125", pad1: "78", pas3: "125", pad3: "70" });
    expect(a?.message).toContain("à 3 min");
  });

  it("pas d'alerte pour des baisses inférieures aux seuils", () => {
    expect(alerteOrthostatisme({ ...repos, pas1: "111", pad1: "71", pas3: "115", pad3: "75" })).toBeNull();
  });

  it("prend le bras gauche comme référence si le droit manque", () => {
    expect(alerteOrthostatisme({ pasG: "140", padG: "85", pas1: "118" })).not.toBeNull();
  });

  it("ne dit rien sans mesure debout", () => {
    expect(alerteOrthostatisme(repos)).toBeNull();
  });
});
