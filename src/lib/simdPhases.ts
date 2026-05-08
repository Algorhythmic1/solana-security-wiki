/** Lifecycle phases for not-yet-fully-shipped security-relevant SIMDs (early → closer to activation). */
export const SIMD_PIPELINE_PHASES = ["draft", "review", "scheduled"] as const;

export type SimdPipelinePhase = (typeof SIMD_PIPELINE_PHASES)[number];

const PHASE_LABEL: Record<SimdPipelinePhase, string> = {
  draft: "Draft",
  review: "In review",
  scheduled: "Scheduled",
};

export function isSimdPipelinePhase(p: string): p is SimdPipelinePhase {
  return (SIMD_PIPELINE_PHASES as readonly string[]).includes(p);
}

export function simdPhaseIndex(phase: string): number {
  const i = SIMD_PIPELINE_PHASES.indexOf(phase as SimdPipelinePhase);
  if (i >= 0) return i;
  return SIMD_PIPELINE_PHASES.length;
}

/** Sort key: scheduled first, then review, then draft; unknown phases last. */
export function simdPhaseListOrder(phase: string): number {
  const p = simdPhaseIndex(phase);
  if (p < 0 || p >= SIMD_PIPELINE_PHASES.length) return 99;
  return SIMD_PIPELINE_PHASES.length - 1 - p;
}

export function simdPhaseLabel(phase: string): string {
  if (isSimdPipelinePhase(phase)) return PHASE_LABEL[phase];
  return phase.replace(/-/g, " ");
}

export function formatSimdCategory(category: string): string {
  return category
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
