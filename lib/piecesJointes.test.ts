import { describe, expect, it } from "vitest";
import path from "path";
import { cheminAbsolu, PIECES_JOINTES_DIR } from "./piecesJointes";

describe("stockage des pièces jointes", () => {
  it("résout un chemin dans le dossier de stockage", () => {
    expect(cheminAbsolu(path.join("visite-1", "a.pdf"))).toBe(path.resolve(PIECES_JOINTES_DIR, "visite-1", "a.pdf"));
  });

  it("refuse toute sortie du dossier (../)", () => {
    expect(() => cheminAbsolu("../.env")).toThrow();
    expect(() => cheminAbsolu("visite/../../secret.pdf")).toThrow();
  });
});
