/** Parse YYYY-MM-DD to UTC noon ms for stable ordering. */
export function isoDateToTime(iso: string): number {
  return new Date(`${iso}T12:00:00.000Z`).getTime();
}

/** Convert UTC ms to YYYY-MM-DD (UTC calendar day). */
export function timeToIsoDate(t: number): string {
  const d = new Date(t);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
