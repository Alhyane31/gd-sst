// Stockage des pièces jointes d'examen : hors de public/, servi uniquement via l'API (session requise).
import path from "path";

export const PIECES_JOINTES_DIR =
  process.env.PIECES_JOINTES_DIR ?? path.join(process.cwd(), "storage", "pieces-jointes");

export const TAILLE_MAX_PIECE_JOINTE = 20 * 1024 * 1024; // 20 Mo

export const TYPES_PIECE_JOINTE: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Chemin absolu d'une pièce, en refusant toute sortie du dossier de stockage */
export function cheminAbsolu(cheminRelatif: string): string {
  const abs = path.resolve(PIECES_JOINTES_DIR, cheminRelatif);
  if (!abs.startsWith(path.resolve(PIECES_JOINTES_DIR) + path.sep)) {
    throw new Error("Chemin de pièce jointe invalide");
  }
  return abs;
}
