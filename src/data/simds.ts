import raw from "./simds.json";
import type { SimdPipelinePhase } from "../lib/simdPhases";

export interface SimdSource {
  label: string;
  url: string;
}

export interface Simd {
  id: string;
  number: number | null;
  title: string;
  phase: SimdPipelinePhase | string;
  phaseDetail: string;
  category: string;
  shortDescription: string;
  securityImplications: string;
  relatedIncidents: string[];
  supersedes: string[];
  dependencies: string[];
  sources: SimdSource[];
}

interface SimdFile {
  simds: Simd[];
}

export const simds: Simd[] = (raw as SimdFile).simds;
