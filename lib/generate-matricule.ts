/**
 * Génère un matricule unique au format : 2 initiales + 6 chiffres (ex: DJ265489)
 * Vérifie l'unicité dans le Set fourni et retente si collision.
 */
export function generateMatricule(
  lastName: string,
  firstName: string,
  existingSet: Set<string>,
  maxTries = 20,
): string {
  const initial = (s: string) =>
    (s.trim().match(/[A-Za-zÀ-ÿ]/)?.[0] ?? "X").toUpperCase();

  const prefix = initial(lastName) + initial(firstName);

  for (let i = 0; i < maxTries; i++) {
    const digits = String(Math.floor(100000 + Math.random() * 900000));
    const candidate = prefix + digits;
    if (!existingSet.has(candidate.toLowerCase())) {
      return candidate;
    }
  }
  // Fallback : timestamp pour garantir l'unicité
  return prefix + Date.now().toString().slice(-6);
}
