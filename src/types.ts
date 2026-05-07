export type IncidentCategory =
  | "application"
  | "supply-chain"
  | "core-protocol"
  | "network";

export type Severity = "critical" | "high" | "medium" | "low" | "informational";

export interface IncidentSource {
  label: string;
  url: string;
}

export interface Incident {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  category: IncidentCategory;
  severity: Severity;
  /** Approximate USD at time of incident; omit or null when not meaningful */
  estimatedLossUsd: number | null;
  lossDescription?: string;
  mitigated?: boolean;
  summary: string;
  details?: string;
  rootCause?: string;
  response?: string;
  lesson?: string;
  /** Concrete preventive controls that would have blocked or limited this attack. */
  mitigations?: string[];
  tags: string[];
  sources: IncidentSource[];
  relatedIds?: string[];
}
