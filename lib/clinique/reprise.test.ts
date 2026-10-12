import { describe, expect, it } from "vitest";
import { construireArchive } from "./reprise";

describe("reprise v1 → v2", () => {
  it("archive les champs retirés de l'écran, depuis les blocs ou raw", () => {
    const a = construireArchive({
      examenClinique: { examenCliniqueComplet: "RAS" },
      activitesContraintes: { presenceAideTechnique: "non", posturesPredominantes: "ASSISE_PROLONGEE" },
      raw: { examensPracliniques: "Radio normale" },
      antecedents: "HTA",
    });
    expect(a).toMatchObject({
      examenCliniqueComplet: "RAS",
      examensPracliniques: "Radio normale",
      presenceAideTechnique: "non",
      posturesPredominantes: "ASSISE_PROLONGEE",
      antecedentsTexteLibre: "HTA",
    });
    expect(typeof a?.archiveLe).toBe("string");
  });

  it("ignore les champs vides et renvoie null s'il n'y a rien à archiver", () => {
    expect(construireArchive({ examenClinique: { examenCliniqueComplet: "  " } })).toBeNull();
    expect(construireArchive({})).toBeNull();
  });
});
