import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  SIMD_PIPELINE_PHASES,
  simdPhaseIndex,
  simdPhaseLabel,
} from "../lib/simdPhases";
import type { Simd } from "../data/simds";
import { clamp } from "../lib/dates";

type Handle = "start" | "end";

const N = SIMD_PIPELINE_PHASES.length;

/** Match `--phase-rail-y` (11px) + half rail (4px) + gap under rail */
const PHASE_RAIL_CENTER_PX = 11;
const PHASE_DOT_FIRST_TOP =
  PHASE_RAIL_CENTER_PX + 4 + 5;
const PHASE_DOT_STACK_PX = 10;

interface PhaseRangeSliderProps {
  rangeStartPhase: number;
  rangeEndPhase: number;
  onRangeChange: (startPhase: number, endPhase: number) => void;
  dotSimds: Simd[];
}

function phaseCenterPct(phaseIdx: number) {
  return ((phaseIdx + 0.5) / N) * 100;
}

export function PhaseRangeSlider({
  rangeStartPhase,
  rangeEndPhase,
  onRangeChange,
  dotSimds,
}: PhaseRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<Handle | null>(null);
  const rangeRef = useRef({
    start: rangeStartPhase,
    end: rangeEndPhase,
  });
  const [hovered, setHovered] = useState<Simd | null>(null);

  useEffect(() => {
    rangeRef.current = { start: rangeStartPhase, end: rangeEndPhase };
  }, [rangeStartPhase, rangeEndPhase]);

  const setFromClientX = useCallback(
    (clientX: number, which: Handle) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const w = rect.width || 1;
      const pct = clamp(((clientX - rect.left) / w) * 100, 0, 100);
      const phaseIdx = clamp(Math.floor((pct / 100) * N - 1e-6), 0, N - 1);
      const { start: sp0, end: ep0 } = rangeRef.current;

      if (which === "start") {
        const sp = Math.min(phaseIdx, ep0);
        rangeRef.current = { start: sp, end: ep0 };
        onRangeChange(sp, ep0);
      } else {
        const ep = Math.max(phaseIdx, sp0);
        rangeRef.current = { start: sp0, end: ep };
        onRangeChange(sp0, ep);
      }
    },
    [onRangeChange],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const h = draggingRef.current;
      if (!h) return;
      setFromClientX(e.clientX, h);
    };
    const onUp = () => {
      draggingRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [setFromClientX]);

  const onHandleDown =
    (which: Handle) => (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      draggingRef.current = which;
      e.currentTarget.setPointerCapture(e.pointerId);
      setFromClientX(e.clientX, which);
    };

  const onTrackPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const w = rect.width || 1;
    const pct = clamp(((e.clientX - rect.left) / w) * 100, 0, 100);
    const startPct = (rangeStartPhase / N) * 100;
    const endPct = ((rangeEndPhase + 1) / N) * 100;
    const distStart = Math.abs(pct - startPct);
    const distEnd = Math.abs(pct - endPct);
    const which: Handle = distStart <= distEnd ? "start" : "end";
    setFromClientX(e.clientX, which);
  };

  const leftPct = (rangeStartPhase / N) * 100;
  const rightPct = ((rangeEndPhase + 1) / N) * 100;
  const widthPct = Math.max(rightPct - leftPct, 0);

  const dots = useMemo(() => {
    const byPhase = new Map<number, Simd[]>();
    for (const s of dotSimds) {
      const p = simdPhaseIndex(s.phase);
      if (p < 0 || p >= N) continue;
      const list = byPhase.get(p) ?? [];
      list.push(s);
      byPhase.set(p, list);
    }
    const out: { simd: Simd; stack: number; sameCount: number }[] = [];
    for (const [, group] of byPhase) {
      const sorted = [...group].sort((a, b) => a.title.localeCompare(b.title));
      const c = sorted.length;
      sorted.forEach((simd, i) => out.push({ simd, stack: i, sameCount: c }));
    }
    return out;
  }, [dotSimds]);

  const maxStack = useMemo(
    () => dots.reduce((m, d) => Math.max(m, d.stack), 0),
    [dots],
  );
  /** Dots hang just under the rail; shrink excess empty space below */
  const trackHeightPx = Math.max(
    56,
    PHASE_DOT_FIRST_TOP + (maxStack + 1) * PHASE_DOT_STACK_PX + 14,
  );

  const inRange = (simd: Simd) => {
    const p = simdPhaseIndex(simd.phase);
    if (p < 0 || p >= N) return false;
    return p >= rangeStartPhase && p <= rangeEndPhase;
  };

  const startHandlePct = (rangeStartPhase / N) * 100;
  const endHandlePct = ((rangeEndPhase + 1) / N) * 100;

  const resetRange = () => onRangeChange(0, N - 1);

  return (
    <div className="timeline-slider phase-range-slider">
      <div className="timeline-slider-header">
        <span className="timeline-slider-label">
          Phases:{" "}
          <strong>{simdPhaseLabel(SIMD_PIPELINE_PHASES[rangeStartPhase])}</strong>
          {" — "}
          <strong>{simdPhaseLabel(SIMD_PIPELINE_PHASES[rangeEndPhase])}</strong>
        </span>
        <div className="timeline-slider-actions">
          <button
            type="button"
            className="timeline-slider-reset"
            onClick={resetRange}
            disabled={rangeStartPhase === 0 && rangeEndPhase === N - 1}
          >
            All phases
          </button>
        </div>
      </div>

      <p className="timeline-slider-hint muted">
        <strong>Drag</strong> the handles to narrow which lifecycle phases appear
        below. Dots mark each SIMD; dimmed dots are outside the selected phase
        band (after search / category filters).
      </p>

      <div className="phase-range-slider-track">
        <div className="phase-range-slider-grid" aria-hidden>
          {SIMD_PIPELINE_PHASES.map((ph) => (
            <div key={ph} className="phase-range-slider-cell">
              <span className="phase-range-slider-cell-label">
                {simdPhaseLabel(ph)}
              </span>
            </div>
          ))}
        </div>
        <div
          ref={trackRef}
          className="timeline-slider-track-hit phase-range-slider-bar"
          style={{ height: trackHeightPx }}
          onPointerDown={onTrackPointerDown}
          role="presentation"
        >
        <div className="timeline-slider-range-fill phase-range-slider-fill" style={{ left: `${leftPct}%`, width: `${widthPct}%` }} />
        <div className="timeline-slider-dots" aria-hidden>
          {dots.map(({ simd, stack, sameCount }) => {
            const p = simdPhaseIndex(simd.phase);
            if (p < 0 || p >= N) return null;
            const basePct = phaseCenterPct(p);
            const jitter =
              sameCount > 1
                ? (stack - (sameCount - 1) / 2) * 2.8
                : 0;
            const pct = basePct + jitter;
            if (pct < -8 || pct > 108) return null;
            const active = inRange(simd);
            return (
              <div
                key={simd.id}
                className="timeline-slider-dot-slot"
                style={{
                  left: `${pct}%`,
                  top: `${PHASE_DOT_FIRST_TOP + stack * PHASE_DOT_STACK_PX}px`,
                  bottom: "auto",
                }}
              >
                <a
                  href={`#${simd.id}`}
                  className={`timeline-slider-dot timeline-slider-dot--medium${active ? "" : " timeline-slider-dot--dim"}`}
                  title={simd.title}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseEnter={() => setHovered(simd)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(simd)}
                  onBlur={() => setHovered(null)}
                  aria-label={`${simd.title}, ${simdPhaseLabel(simd.phase)}`}
                />
                {hovered?.id === simd.id && (
                  <div className="timeline-slider-tooltip" role="tooltip">
                    <span className="timeline-slider-tooltip-date">
                      {simdPhaseLabel(simd.phase)}
                    </span>
                    <span className="timeline-slider-tooltip-title">
                      {simd.title}
                    </span>
                    <span className="timeline-slider-tooltip-summary">
                      {simd.shortDescription.slice(0, 220)}
                      {simd.shortDescription.length > 220 ? "…" : ""}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="timeline-slider-handle timeline-slider-handle--start"
          style={{ left: `${clamp(startHandlePct, 0, 100)}%` }}
          onPointerDown={onHandleDown("start")}
          aria-label={`Phase range start, ${simdPhaseLabel(SIMD_PIPELINE_PHASES[rangeStartPhase])}`}
        />
        <button
          type="button"
          className="timeline-slider-handle timeline-slider-handle--end"
          style={{ left: `${clamp(endHandlePct, 0, 100)}%` }}
          onPointerDown={onHandleDown("end")}
          aria-label={`Phase range end, ${simdPhaseLabel(SIMD_PIPELINE_PHASES[rangeEndPhase])}`}
        />
        </div>
      </div>

      <div className="timeline-slider-axis phase-range-slider-axis">
        <span>{simdPhaseLabel(SIMD_PIPELINE_PHASES[0])}</span>
        <span className="timeline-slider-axis-center">pipeline order →</span>
        <span>{simdPhaseLabel(SIMD_PIPELINE_PHASES[N - 1])}</span>
      </div>
    </div>
  );
}
