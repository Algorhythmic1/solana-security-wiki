import type { Incident, IncidentCategory } from "../types";

export function incidentMatchesQuery(inc: Incident, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.toLowerCase();
  const hay = [
    inc.title,
    inc.summary,
    inc.details,
    inc.rootCause,
    inc.response,
    inc.lesson,
    ...inc.tags,
    inc.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

export function filterIncidents(
  incidents: Incident[],
  opts: {
    query: string;
    category: IncidentCategory | "all";
    year: string | "all";
    /** Inclusive lower bound (ISO YYYY-MM-DD) */
    dateFrom?: string;
    /** Inclusive upper bound (ISO YYYY-MM-DD) */
    dateTo?: string;
  },
): Incident[] {
  return incidents.filter((inc) => {
    if (!incidentMatchesQuery(inc, opts.query)) return false;
    if (opts.category !== "all" && inc.category !== opts.category) return false;
    if (opts.year !== "all" && !inc.date.startsWith(opts.year)) return false;
    if (opts.dateFrom != null && opts.dateFrom !== "" && inc.date < opts.dateFrom)
      return false;
    if (opts.dateTo != null && opts.dateTo !== "" && inc.date > opts.dateTo)
      return false;
    return true;
  });
}
