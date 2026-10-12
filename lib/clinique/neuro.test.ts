import { describe, expect, it } from "vitest";
import { alerteQueueDeCheval, alertesRachisCervical } from "./neuro";

describe("Rachis cervical : avis spécialisé", () => {
  it("alerte si Hoffmann est positif (D, G ou bilatéral)", () => {
    expect(alertesRachisCervical({ HOFFMANN: "POSITIF_D" })).toHaveLength(1);
    expect(alertesRachisCervical({ HOFFMANN: "BILATERAL" })[0].message).toContain("avis spécialisé");
  });

  it("alerte si Lhermitte est positif", () => {
    expect(alertesRachisCervical({ LHERMITTE: "POSITIF_G" })).toHaveLength(1);
  });

  it("une seule alerte qui cite les deux signes", () => {
    const a = alertesRachisCervical({ HOFFMANN: "POSITIF_D", LHERMITTE: "POSITIF_G" });
    expect(a).toHaveLength(1);
    expect(a[0].message).toContain("Hoffmann et signe de Lhermitte");
  });

  it("pas d'alerte si négatif, non fait ou autre test positif", () => {
    expect(alertesRachisCervical({ HOFFMANN: "NEGATIF", LHERMITTE: "NON_FAIT", SPURLING: "POSITIF_D" })).toHaveLength(0);
    expect(alertesRachisCervical(undefined)).toHaveLength(0);
  });
});

describe("Queue de cheval : orientation en urgence", () => {
  it("alerte dès qu'un signe est coché", () => {
    expect(alerteQueueDeCheval(["ANESTHESIE_SELLE"])?.severite).toBe("error");
  });

  it("pas d'alerte si « Aucun » seul ou rien", () => {
    expect(alerteQueueDeCheval(["AUCUN"])).toBeNull();
    expect(alerteQueueDeCheval([])).toBeNull();
    expect(alerteQueueDeCheval(undefined)).toBeNull();
  });
});
