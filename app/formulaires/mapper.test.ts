import { describe, expect, it } from "vitest";
import { mapApiToFormData } from "./mapper";

const base = {
  visite: { type: "ANNUELLE" },
  personnel: { firstName: "Ali", lastName: "Test", pathologies: [] },
};

describe("mapApiToFormData", () => {
  it("relit les champs enregistrés dans raw (renvoyé par le GET)", () => {
    const f = mapApiToFormData({
      ...base,
      formulaire: { raw: { grade: "GRADE_1", nombreEnfants: "2", anneeEtude: "3" } },
    });
    expect(f.grade).toBe("GRADE_1");
    expect(f.nombreEnfants).toBe("2");
    expect(f.anneeEtude).toBe("3");
  });

  it("reste compatible avec l'ancien format data.raw", () => {
    const f = mapApiToFormData({ ...base, formulaire: { data: { raw: { grade: "HORS_GRADE" } } } });
    expect(f.grade).toBe("HORS_GRADE");
  });
});
