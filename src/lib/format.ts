import type { IncidentCategory } from "../types";

const categoryLabels: Record<IncidentCategory, string> = {
  application: "Application",
  "supply-chain": "Supply chain",
  "core-protocol": "Core protocol",
  network: "Network / infra",
};

export function categoryLabel(c: IncidentCategory): string {
  return categoryLabels[c];
}

export function formatUsd(n: number | null): string {
  if (n === null) return "—";
  if (n === 0) return "$0";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toLocaleString()}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00Z" : ""));
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
