export function mitLocalStorage<Ergebnis>(
  aktion: (speicher: Storage) => Ergebnis,
  ersatzwert: Ergebnis,
): Ergebnis {
  try {
    return aktion(localStorage)
  } catch {
    return ersatzwert
  }
}
