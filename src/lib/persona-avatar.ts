/** Stable illustrated faces per prospect (DiceBear avataaars, seed = persona id). */
export function personaAvatarUrl(personaId: string): string {
  const q = new URLSearchParams({
    seed: personaId,
    backgroundColor: "ffd5dc,c0aede,d1d4f9,b6e3f4,ffdfbf,f8e8ee",
  });
  return `https://api.dicebear.com/7.x/avataaars/svg?${q.toString()}`;
}
