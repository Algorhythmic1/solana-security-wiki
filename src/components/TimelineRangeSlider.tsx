import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Link } from "react-router-dom";
import type { Incident } from "../types";
import { formatDate } from "../lib/format";
import { clamp, isoDateToTime, timeToIsoDate } from "../lib/dates";

type Handle = "start" | "end";

/** Narrowest view: ~18 hours (same calendar day incidents still spread if view is one day). */
const MIN_VIEW_MS = 18 * 60 * 60 * 1000;
const ZOOM_STEP = 1.12;

interface TimelineRangeSliderProps {
  dataMin: string;
  dataMax: string;
  rangeStart: string;
  rangeEnd: string;
  onRangeChange: (start: string, end: string) => void;
  /** Incidents to plot as dots (typically same filters as list minus date range). */
  dotIncidents: Incident[];
}

function severityDotClass(s: string): string {
  return `timeline-slider-dot timeline-slider-dot--${s}`;
}

function clampViewToData(
  vMin: number,
  vMax: number,
  dataMinT: number,
  dataMaxT: number,
): [number, number] {
  const dataSpan = dataMaxT - dataMinT;
  let span = vMax - vMin;
  span = Math.max(span, MIN_VIEW_MS);
  span = Math.min(span, dataSpan);
  let nMin = vMin;
  let nMax = vMax;
  if (nMax - nMin !== span) {
    const mid = (nMin + nMax) / 2;
    nMin = mid - span / 2;
    nMax = mid + span / 2;
  }
  if (nMin < dataMinT) {
    nMin = dataMinT;
    nMax = dataMinT + span;
  }
  if (nMax > dataMaxT) {
    nMax = dataMaxT;
    nMin = dataMaxT - span;
  }
  return [nMin, nMax];
}

export function TimelineRangeSlider({
  dataMin,
  dataMax,
  rangeStart,
  rangeEnd,
  onRangeChange,
  dotIncidents,
}: TimelineRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<Handle | null>(null);
  const rangeRef = useRef({ start: rangeStart, end: rangeEnd });
  const [hovered, setHovered] = useState<Incident | null>(null);

  const tMin = useMemo(() => isoDateToTime(dataMin), [dataMin]);
  const tMax = useMemo(() => isoDateToTime(dataMax), [dataMax]);
  const dataSpan = Math.max(tMax - tMin, 1);

  const [viewMinT, setViewMinT] = useState(tMin);
  const [viewMaxT, setViewMaxT] = useState(tMax);

  useEffect(() => {
    setViewMinT(tMin);
    setViewMaxT(tMax);
  }, [tMin, tMax]);

  const viewRef = useRef({ min: viewMinT, max: viewMaxT });
  useEffect(() => {
    viewRef.current = { min: viewMinT, max: viewMaxT };
  }, [viewMinT, viewMaxT]);

  useEffect(() => {
    rangeRef.current = { start: rangeStart, end: rangeEnd };
  }, [rangeStart, rangeEnd]);

  const viewSpan = Math.max(viewMaxT - viewMinT, 1);

  const timeToViewPct = useCallback(
    (t: number) => ((t - viewMinT) / viewSpan) * 100,
    [viewMinT, viewSpan],
  );

  const pctToViewTime = useCallback(
    (pct: number) => viewMinT + (viewSpan * clamp(pct, 0, 100)) / 100,
    [viewMinT, viewSpan],
  );

  const setFromClientX = useCallback(
    (clientX: number, which: Handle) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pct = ((clientX - rect.left) / rect.width) * 100;
      const t = pctToViewTime(pct);
      const day = timeToIsoDate(t);
      const { start: rs, end: re } = rangeRef.current;

      if (which === "start") {
        const next = day > re ? re : day;
        rangeRef.current = { start: next, end: re };
        onRangeChange(next, re);
      } else {
        const next = day < rs ? rs : day;
        rangeRef.current = { start: rs, end: next };
        onRangeChange(rs, next);
      }
    },
    [pctToViewTime, onRangeChange],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const w = draggingRef.current;
      if (!w) return;
      setFromClientX(e.clientX, w);
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
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    const startT = isoDateToTime(rangeStart);
    const endT = isoDateToTime(rangeEnd);
    const startPct = clamp(timeToViewPct(startT), 0, 100);
    const endPct = clamp(timeToViewPct(endT), 0, 100);
    const distStart = Math.abs(pct - startPct);
    const distEnd = Math.abs(pct - endPct);
    const which: Handle = distStart <= distEnd ? "start" : "end";
    setFromClientX(e.clientX, which);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const { min: v0, max: v1 } = viewRef.current;
      const span = Math.max(v1 - v0, 1);
      const rect = el.getBoundingClientRect();
      const w = rect.width || 1;

      const zoomedIn = span < dataSpan - 1000;
      const dominantX = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const wantPan =
        zoomedIn && (e.shiftKey || (dominantX && Math.abs(e.deltaX) > 0));

      if (wantPan) {
        e.preventDefault();
        const delta = e.shiftKey ? e.deltaY : e.deltaX;
        const panMs = (delta / w) * span * 0.55;
        let nMin = v0 + panMs;
        let nMax = v1 + panMs;
        if (nMin < tMin) {
          nMax += tMin - nMin;
          nMin = tMin;
        }
        if (nMax > tMax) {
          nMin -= nMax - tMax;
          nMax = tMax;
        }
        const [a, b] = clampViewToData(nMin, nMax, tMin, tMax);
        setViewMinT(a);
        setViewMaxT(b);
        return;
      }

      e.preventDefault();
      const zoomOut = e.deltaY > 0;
      const factor = zoomOut ? ZOOM_STEP : 1 / ZOOM_STEP;
      let newSpan = span * factor;
      newSpan = clamp(newSpan, MIN_VIEW_MS, dataSpan);

      const mousePct = clamp((e.clientX - rect.left) / w, 0, 1);
      const focusT = v0 + mousePct * span;
      let nMin = focusT - mousePct * newSpan;
      let nMax = focusT + (1 - mousePct) * newSpan;
      const [a, b] = clampViewToData(nMin, nMax, tMin, tMax);
      setViewMinT(a);
      setViewMaxT(b);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [tMin, tMax, dataSpan]);

  const dots = useMemo(() => {
    const byDate = new Map<string, Incident[]>();
    for (const inc of dotIncidents) {
      const list = byDate.get(inc.date) ?? [];
      list.push(inc);
      byDate.set(inc.date, list);
    }
    const out: { inc: Incident; stack: number; sameDayCount: number }[] = [];
    for (const [, group] of byDate) {
      const sorted = [...group].sort((a, b) => a.id.localeCompare(b.id));
      const n = sorted.length;
      sorted.forEach((inc, i) => out.push({ inc, stack: i, sameDayCount: n }));
    }
    return out;
  }, [dotIncidents]);

  const maxStack = useMemo(
    () => dots.reduce((m, d) => Math.max(m, d.stack), 0),
    [dots],
  );
  /** Extra vertical room: taller base + more per stacked row */
  const trackHeightPx = Math.max(88, 52 + maxStack * 11 + 32);

  const inRange = (iso: string) => iso >= rangeStart && iso <= rangeEnd;

  const startT = isoDateToTime(rangeStart);
  const endT = isoDateToTime(rangeEnd);
  let startPct = timeToViewPct(startT);
  let endPct = timeToViewPct(endT);
  if (startPct > endPct) [startPct, endPct] = [endPct, startPct];
  const startPctClamped = clamp(startPct, 0, 100);
  const endPctClamped = clamp(endPct, 0, 100);

  const isZoomed = viewMaxT - viewMinT < dataSpan - 1000;

  const resetView = () => {
    setViewMinT(tMin);
    setViewMaxT(tMax);
  };

  return (
    <div className="timeline-slider">
      <div className="timeline-slider-header">
        <span className="timeline-slider-label">
          Date range: <strong>{formatDate(rangeStart)}</strong>
          {" — "}
          <strong>{formatDate(rangeEnd)}</strong>
        </span>
        <div className="timeline-slider-actions">
          <button
            type="button"
            className="timeline-slider-reset"
            onClick={resetView}
            disabled={!isZoomed}
            title="Show the full timeline width again"
          >
            Reset zoom
          </button>
          <button
            type="button"
            className="timeline-slider-reset"
            onClick={() => onRangeChange(dataMin, dataMax)}
            disabled={rangeStart === dataMin && rangeEnd === dataMax}
          >
            Full range
          </button>
        </div>
      </div>

      <p className="timeline-slider-hint muted">
        <strong>Scroll</strong> on the bar to zoom in or out (pointer over where
        you want to zoom). <strong>Shift + scroll</strong> or horizontal trackpad
        scroll pans when zoomed.
      </p>

      <div
        className="timeline-slider-track-hit"
        ref={trackRef}
        style={{ height: trackHeightPx }}
        onPointerDown={onTrackPointerDown}
        role="presentation"
      >
        <div className="timeline-slider-track-bg" />
        <div
          className="timeline-slider-range-fill"
          style={{
            left: `${startPctClamped}%`,
            width: `${Math.max(endPctClamped - startPctClamped, 0)}%`,
          }}
        />
        <div className="timeline-slider-dots" aria-hidden>
          {dots.map(({ inc, stack, sameDayCount }) => {
            const basePct = timeToViewPct(isoDateToTime(inc.date));
            /** Spread same-calendar-day dots horizontally (data is day-granularity). */
            const jitter =
              sameDayCount > 1
                ? (stack - (sameDayCount - 1) / 2) * 0.55
                : 0;
            const pct = basePct + jitter;
            if (pct < -8 || pct > 108) return null;
            const active = inRange(inc.date);
            return (
              <div
                key={inc.id}
                className="timeline-slider-dot-slot"
                style={{
                  left: `${pct}%`,
                  bottom: `${14 + stack * 9}px`,
                }}
              >
                <Link
                  to={`/incident/${inc.id}`}
                  className={`${severityDotClass(inc.severity)}${active ? "" : " timeline-slider-dot--dim"}`}
                  title={inc.title}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseEnter={() => setHovered(inc)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(inc)}
                  onBlur={() => setHovered(null)}
                  aria-label={`${inc.title}, ${formatDate(inc.date)}`}
                />
                {hovered?.id === inc.id && (
                  <div className="timeline-slider-tooltip" role="tooltip">
                    <span className="timeline-slider-tooltip-date">
                      {formatDate(inc.date)}
                    </span>
                    <span className="timeline-slider-tooltip-title">
                      {inc.title}
                    </span>
                    <span className="timeline-slider-tooltip-summary">
                      {inc.summary}
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
          style={{ left: `${clamp(startPct, 0, 100)}%` }}
          onPointerDown={onHandleDown("start")}
          aria-label={`Start of date range, ${formatDate(rangeStart)}`}
        />
        <button
          type="button"
          className="timeline-slider-handle timeline-slider-handle--end"
          style={{ left: `${clamp(endPct, 0, 100)}%` }}
          onPointerDown={onHandleDown("end")}
          aria-label={`End of date range, ${formatDate(rangeEnd)}`}
        />
      </div>

      <div className="timeline-slider-axis">
        <span>{formatDate(timeToIsoDate(viewMinT))}</span>
        <span className="timeline-slider-axis-center">
          {isZoomed ? "zoomed view" : "full span"}
        </span>
        <span>{formatDate(timeToIsoDate(viewMaxT))}</span>
      </div>
    </div>
  );
}
