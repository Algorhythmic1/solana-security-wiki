export interface MiscResourceLink {
  url: string;
  title: string;
  description: string;
}

/** Curated lists, builder tooling, and skills adjacent to Solana auditing */
export const toolsAndTechniques: MiscResourceLink[] = [
  {
    url: "https://github.com/0xMacro/awesome-solana-security",
    title: "awesome-solana-security (0xMacro)",
    description:
      "Curated index of Solana security references—repos, posts, tools, and learning material.",
  },
  {
    url: "https://github.com/J4X-Security/K.I.T",
    title: "K.I.T (J4X Security)",
    description:
      "Knowledge and instrumentation toolkit—scripts, prompts, and workflows useful in review work.",
  },
  {
    url: "https://github.com/Frankcastleauditor/safe-solana-builder",
    title: "safe-solana-builder",
    description:
      "Templates and patterns oriented toward safer Anchor/Solana project scaffolding.",
  },
];

/** Public audit write-ups and report archives */
export const publicAuditReports: MiscResourceLink[] = [
  {
    url: "https://github.com/Frankcastleauditor/public-audits",
    title: "Frankcastleauditor — public audits",
    description:
      "GitHub-hosted audit reports and findings from Frankcastleauditor engagements.",
  },
  {
    url: "https://github.com/AdevarLabs/audit-reports",
    title: "Adevar Labs — audit reports",
    description:
      "Published reports from Adevar Labs Solana and related reviews.",
  },
  {
    url: "https://github.com/zenith-security/reports/tree/main/reports",
    title: "Zenith Security — reports",
    description:
      "Report PDFs and summaries in Zenith Security’s public reports tree.",
  },
  {
    url: "https://www.certora.com/reports",
    title: "Certora — reports",
    description:
      "Formal-verification and audit report listings from Certora (includes Solana-related work where published).",
  },
];
