import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PhaseRangeSlider } from "../components/PhaseRangeSlider";
import { simds, type Simd } from "../data/simds";
import { incidents } from "../data/incidents";
import {
  SIMD_PIPELINE_PHASES,
  formatSimdCategory,
  simdPhaseIndex,
  simdPhaseLabel,
  simdPhaseListOrder,
} from "../lib/simdPhases";

const incidentIdSet = new Set(incidents.map((i) => i.id));
const simdIdSet = new Set(simds.map((s) => s.id));
const simdById = new Map(simds.map((s) => [s.id, s]));

function simdHeading(simd: Simd): string {
  if (simd.number != null) return `SIMD-${simd.number}`;
  return "SIMD (TBD)";
}

function phasePillClass(phase: string): string {
  const p = simdPhaseIndex(phase);
  if (p === 0) return "pill simd-phase-draft";
  if (p === 1) return "pill simd-phase-review";
  if (p === 2) return "pill simd-phase-scheduled";
  return "pill";
}

function filterSimds(
  list: Simd[],
  query: string,
  category: string,
  startPhase: number,
  endPhase: number,
): Simd[] {
  const q = query.trim().toLowerCase();
  return list.filter((s) => {
    const p = simdPhaseIndex(s.phase);
    if (p < startPhase || p > endPhase) return false;
    if (category !== "all" && s.category !== category) return false;
    if (!q) return true;
    const hay = `${s.title} ${s.shortDescription} ${s.securityImplications} ${s.phaseDetail}`.toLowerCase();
    return hay.includes(q);
  });
}

function filterSimdsPrePhase(list: Simd[], query: string, category: string): Simd[] {
  const q = query.trim().toLowerCase();
  return list.filter((s) => {
    if (category !== "all" && s.category !== category) return false;
    if (!q) return true;
    const hay = `${s.title} ${s.shortDescription} ${s.securityImplications} ${s.phaseDetail}`.toLowerCase();
    return hay.includes(q);
  });
}

export function SimdsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [rangeStartPhase, setRangeStartPhase] = useState(0);
  const [rangeEndPhase, setRangeEndPhase] = useState(SIMD_PIPELINE_PHASES.length - 1);

  const categories = useMemo(() => {
    const u = new Set(simds.map((s) => s.category));
    return [...u].sort();
  }, []);

  const onPhaseRangeChange = useCallback((start: number, end: number) => {
    setRangeStartPhase(start);
    setRangeEndPhase(end);
  }, []);

  const prePhaseFiltered = useMemo(
    () => filterSimdsPrePhase(simds, query, category),
    [query, category],
  );

  const filtered = useMemo(
    () => filterSimds(simds, query, category, rangeStartPhase, rangeEndPhase),
    [query, category, rangeStartPhase, rangeEndPhase],
  );

  const sortedFiltered = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const ra = simdPhaseListOrder(a.phase);
        const rb = simdPhaseListOrder(b.phase);
        if (ra !== rb) return ra - rb;
        return a.title.localeCompare(b.title);
      }),
    [filtered],
  );

  return (
    <article className="article">
      <p className="muted">
        <Link to="/">← Timeline</Link>
      </p>
      <h1>Solana Improvement Documents (security)</h1>
      <p className="muted">
        SIMDs with meaningful security or validator-accountability impact that are{" "}
        <strong>not yet fully implemented on mainnet</strong> in their described
        end state—or remain gated, in flux, or dependent on follow-on work. Each
        entry includes a short summary, lifecycle phase, and our analysis of the
        security tradeoffs. Primary sources are linked; verify details against the
        official SIMD repo. Sources: <br /> 
        <ul>
        <li><a href="https://github.com/solana-foundation/solana-improvement-documents" target="_blank" rel="noreferrer">
          solana-improvement-documents
        </a></li>
        <li><a href="https://simd.mixy.one" target="_blank" rel="noreferrer">
          SIMD Mirror (status tracker)
        </a></li>
        </ul>
      </p>

      <div className="filters simd-filters">
        <div className="field">
          <label htmlFor="simd-q">Search</label>
          <input
            id="simd-q"
            type="search"
            placeholder="slashing, BLS, async execution…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label htmlFor="simd-cat">Category</label>
          <select
            id="simd-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {formatSimdCategory(c)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <PhaseRangeSlider
        rangeStartPhase={rangeStartPhase}
        rangeEndPhase={rangeEndPhase}
        onRangeChange={onPhaseRangeChange}
        dotSimds={prePhaseFiltered}
      />

      <p className="muted">
        Showing <strong>{filtered.length}</strong> of {prePhaseFiltered.length} in
        view (of {simds.length} total), ordered by phase then title: scheduled first,
        then in review, then draft (closest to activation at the top).
      </p>

      <ul className="timeline simd-timeline">
        {sortedFiltered.map((simd) => (
          <li key={simd.id}>
            <article className="incident-card simd-card" id={simd.id}>
              <div className="incident-meta simd-card-meta">
                <span className={phasePillClass(simd.phase)}>
                  {simdPhaseLabel(simd.phase)}
                </span>
                <span className="pill">{formatSimdCategory(simd.category)}</span>
                <span className="pill simd-num-pill">{simdHeading(simd)}</span>
              </div>
              <h2 className="simd-card-title">{simd.title}</h2>
              <p className="simd-phase-detail muted">{simd.phaseDetail}</p>
              <section className="simd-section">
                <h3 className="simd-section-title">Summary</h3>
                <p className="simd-section-body">{simd.shortDescription}</p>
              </section>
              <section className="simd-section">
                <h3 className="simd-section-title">Security analysis</h3>
                <div className="simd-analysis">
                  {simd.securityImplications.split(/\n\n+/).map((para, i) => (
                    <p key={i} className="simd-section-body">
                      {para}
                    </p>
                  ))}
                </div>
              </section>
              {simd.supersedes.length > 0 && (
                <section className="simd-section">
                  <h3 className="simd-section-title">Supersedes</h3>
                  <ul className="simd-inline-list">
                    {simd.supersedes.map((sid) => {
                      const t = simdById.get(sid);
                      return simdIdSet.has(sid) && t ? (
                        <li key={sid}>
                          <a href={`#${sid}`}>{t.title}</a>
                        </li>
                      ) : (
                        <li key={sid}>
                          <code className="simd-code">{sid}</code>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
              {simd.dependencies.length > 0 && (
                <section className="simd-section">
                  <h3 className="simd-section-title">Dependencies</h3>
                  <ul className="simd-inline-list">
                    {simd.dependencies.map((dep) => {
                      const t = simdById.get(dep);
                      return simdIdSet.has(dep) && t ? (
                        <li key={dep}>
                          <a href={`#${dep}`}>{t.title}</a>
                        </li>
                      ) : (
                        <li key={dep}>
                          <code className="simd-code">{dep}</code>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
              {simd.relatedIncidents.length > 0 && (
                <section className="simd-section">
                  <h3 className="simd-section-title">Related incidents</h3>
                  <ul className="simd-inline-list">
                    {simd.relatedIncidents.map((rid) =>
                      incidentIdSet.has(rid) ? (
                        <li key={rid}>
                          <Link to={`/incident/${rid}`}>{rid.replace(/-/g, " ")}</Link>
                        </li>
                      ) : (
                        <li key={rid}>
                          <code className="simd-code">{rid}</code>{" "}
                          <span className="muted">(not in this wiki&apos;s timeline)</span>
                        </li>
                      ),
                    )}
                  </ul>
                </section>
              )}
              {simd.sources.length > 0 && (
                <section className="simd-section">
                  <h3 className="simd-section-title">Sources</h3>
                  <ul className="sources-list simd-sources">
                    {simd.sources.map((src) => (
                      <li key={src.url}>
                        <a href={src.url} target="_blank" rel="noreferrer">
                          {src.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </article>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="muted">No SIMDs match these filters.</p>
      )}

      <footer className="footer-note">
        Phase labels follow the data in each SIMD; &quot;scheduled&quot; includes
        accepted work waiting on feature gates or coordinated rollout. This page is
        editorial—always confirm status in{" "}
        <a
          href="https://github.com/solana-foundation/solana-improvement-documents"
          target="_blank"
          rel="noreferrer"
        >
          solana-improvement-documents
        </a>
        .
      </footer>
    </article>
  );
}
