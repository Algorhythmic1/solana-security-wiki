import { Link } from "react-router-dom";
import {
  publicAuditReports,
  toolsAndTechniques,
} from "../data/miscResources";

function ResourceSection({
  id,
  heading,
  lede,
  items,
}: {
  id: string;
  heading: string;
  lede: string;
  items: { url: string; title: string; description: string }[];
}) {
  return (
    <section id={id} className="article-section">
      <h2>{heading}</h2>
      <p className="muted">{lede}</p>
      <ul className="misc-resource-list">
        {items.map((item) => (
          <li key={item.url}>
            <a
              className="misc-resource-card"
              href={item.url}
              target="_blank"
              rel="noreferrer"
            >
              <span className="misc-resource-title">{item.title}</span>
              <span className="misc-resource-desc">{item.description}</span>
              <span className="misc-resource-url">{item.url}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MiscResourcesPage() {
  return (
    <article className="article">
      <p className="muted">
        <Link to="/">← Timeline</Link>
      </p>
      <h1>Miscellaneous resources</h1>
      <p className="muted">
        External repos and sites—curated lists and tooling first, then public
        audit archives. All links open in a new tab.
      </p>

      <aside className="toc">
        <h3>On this page</h3>
        <ol>
          <li>
            <a href="#tools">Tools, skills &amp; curated lists</a>
          </li>
          <li>
            <a href="#audits">Public audit reports</a>
          </li>
        </ol>
      </aside>

      <ResourceSection
        id="tools"
        heading="Tools, skills &amp; curated lists"
        lede="Awesome lists, review kits, and builder-oriented repos—useful even when they mix Claude skills, scripts, and conventions."
        items={toolsAndTechniques}
      />

      <ResourceSection
        id="audits"
        heading="Public audit reports"
        lede="GitHub folders and vendor pages that publish or index audit PDFs and summaries."
        items={publicAuditReports}
      />
    </article>
  );
}
