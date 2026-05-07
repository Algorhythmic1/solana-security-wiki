import raw from "./incidents.json";
import type { Incident } from "../types";

export const incidents: Incident[] = raw as Incident[];

export function getIncidentById(id: string): Incident | undefined {
  return incidents.find((i) => i.id === id);
}
