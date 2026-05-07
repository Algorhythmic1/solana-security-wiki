import { Link } from "react-router-dom";
import { useMemo } from "react";
import { incidents } from "../data/incidents";
import { formatUsd } from "../lib/format";

function countBy<T extends string | number>(
  arr: T[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of arr) out[String(v)] = (out[String(v)] ?? 0) + 1;
  return out;
}

export function TrendsPage() {
  const stats = useMemo(() => {
    const real = incidents.filter((i) => i.severity !== "informational");
    const byYear = countBy(real.map((i) => i.date.slice(0, 4)));
    const byCat = countBy(real.map((i) => i.category));
    const losses = real.reduce(
      (acc, i) => acc + (i.estimatedLossUsd ?? 0),
      0,
    );
    const recent = real.filter((i) => i.date >= "2025-01-01");
    const recentLosses = recent.reduce(
      (acc, i) => acc + (i.estimatedLossUsd ?? 0),
      0,
    );
    return {
      total: real.length,
      losses,
      recentCount: recent.length,
      recentLosses,
      byYear,
      byCat,
    };
  }, []);

  return (
    <article className="article">
      <p className="muted">
        <Link to="/">← Timeline</Link>
      </p>
      <h1>Trends in Solana exploitation activity</h1>
      <p className="muted">
        A meta-analysis across the {stats.total} non-informational incidents
        catalogued here, focused on what defenders should be paying attention to
        right now.
      </p>

      <div className="kpi-row">
        <div className="stat-card">
          <p className="stat-value">{stats.total}</p>
          <p className="stat-label">Tracked incidents</p>
        </div>
        <div className="stat-card">
          <p className="stat-value">{formatUsd(stats.losses)}</p>
          <p className="stat-label">Sum of stated USD losses</p>
        </div>
        <div className="stat-card">
          <p className="stat-value">{stats.recentCount}</p>
          <p className="stat-label">Since 2025-01-01</p>
        </div>
        <div className="stat-card">
          <p className="stat-value">{formatUsd(stats.recentLosses)}</p>
          <p className="stat-label">Recent USD losses</p>
        </div>
      </div>

      <aside className="toc">
        <h3>On this page</h3>
        <ol>
          <li>
            <a href="#shift">The shift from contract bugs to operational compromise</a>
          </li>
          <li>
            <a href="#solana-specific">Solana-specific attack vectors maturing</a>
          </li>
          <li>
            <a href="#dprk">DPRK and other state-linked actors</a>
          </li>
          <li>
            <a href="#supply-chain">Supply chain in three layers</a>
          </li>
          <li>
            <a href="#user-side">User-side phishing has become quasi-industrial</a>
          </li>
          <li>
            <a href="#defender-priorities">Defender priorities in {new Date().getUTCFullYear()}</a>
          </li>
        </ol>
      </aside>

      <section id="shift" className="article-section">
        <h2>1. The shift from contract bugs to operational compromise</h2>
        <p>
          From 2021–2023, the top-loss Solana incidents were dominated by
          smart-contract logic flaws and economic-design mistakes —{" "}
          <Link to="/incident/wormhole-bridge-feb-2022">Wormhole</Link> (sysvar
          spoofing), <Link to="/incident/cashio-infinite-mint-mar-2022">Cashio</Link>{" "}
          (collateral validation), <Link to="/incident/mango-markets-oracle-oct-2022">Mango Markets</Link>{" "}
          (oracle/perp manipulation),{" "}
          <Link to="/incident/crema-flash-loan-jul-2022">Crema</Link>,{" "}
          <Link to="/incident/nirvana-flash-loan-jul-2022">Nirvana</Link>. They
          could be modeled, audited, fuzzed, and to some extent prevented with
          better engineering hygiene.
        </p>
        <p>
          The largest losses of 2025–2026 look very different. The four biggest
          recent events —{" "}
          <Link to="/incident/drift-protocol-apr-2026">
            Drift (~$285M)
          </Link>
          ,{" "}
          <Link to="/incident/swissborg-kiln-sol-staking-sep-2025">
            SwissBorg / Kiln (~$41M)
          </Link>
          ,{" "}
          <Link to="/incident/upbit-sol-hot-wallet-nov-2025">
            Upbit (~$37M)
          </Link>
          , and{" "}
          <Link to="/incident/step-finance-treasury-jan-2026">
            Step Finance (~$29M)
          </Link>{" "}
          — are all <strong>operational compromises</strong>: phished
          contributors, stolen API tokens, exec endpoint malware, signing
          ceremony failures. The on-chain artifact in these incidents is fully
          authorized and would pass any contract-level review.
        </p>
        <div className="callout">
          <p>
            <strong>Defender takeaway:</strong> a security audit alone will not
            prevent a 2026-style loss. Authority hygiene, signer device
            isolation, and out-of-band verification of multisig payloads are
            now first-class controls.
          </p>
        </div>
      </section>

      <section id="solana-specific" className="article-section">
        <h2>2. Solana-specific attack vectors maturing</h2>
        <p>
          Several attack patterns exploit Solana's unique architecture rather
          than translate from EVM playbooks:
        </p>
        <ul>
          <li>
            <strong>Sysvar / account-confusion attacks</strong> — passing in a
            crafted account where a canonical sysvar should be (
            <Link to="/incident/wormhole-bridge-feb-2022">Wormhole</Link>). Solana's
            account-passing model means programs must verify accounts by
            address, not shape.
          </li>
          <li>
            <strong>Owner-field reassignment phishing</strong> — wallet
            simulations show no token movement, but the transaction
            reassigns account ownership (
            <Link to="/incident/solana-owner-field-phishing-late-2025">
              late-2025 wave
            </Link>
            ). EVM wallets do not have to defend against this.
          </li>
          <li>
            <strong>Durable-nonce social engineering</strong> — pre-signed
            transactions with arbitrary instructions, executed days or weeks
            later (
            <Link to="/incident/drift-protocol-apr-2026">Drift</Link>). A
            durable-nonce signature is a long-lived authorization, not a
            single-use approval.
          </li>
          <li>
            <strong>Privileged on-chain admin instructions</strong> — Raydium,
            Solend, Cashio, Credix, Pump.fun all show that admin functions
            with broad authority become the cleanest attack path once a key or
            signer is compromised.
          </li>
        </ul>
      </section>

      <section id="dprk" className="article-section">
        <h2>3. DPRK and other state-linked actors</h2>
        <p>
          Public attribution by Chainalysis, Elliptic, and TRM Labs places a
          significant share of 2025–2026 large-loss incidents at North
          Korea–linked groups (UNC4736 / AppleJeus / Citrine Sleet). The
          methodology is consistent across targets:
        </p>
        <ul>
          <li>
            Multi-month relationship-building with a contributor or BD lead,
            often through a "quant fund" or "infrastructure partner" cover.
          </li>
          <li>Capital deployed early to look like a real customer.</li>
          <li>
            Endpoint compromise via a code repo, a TestFlight build, or a
            laced IDE/extension.
          </li>
          <li>
            Use of legitimate Solana features (durable nonces, multisig
            ceremonies, collateral whitelisting) to package the final theft as
            a normal-looking sequence of authorized transactions.
          </li>
        </ul>
        <p>
          Smaller teams should assume they are not too small to be targeted;
          campaigns appear to scout broadly and pursue any contributor with
          access to a multisig signer or upgrade authority.
        </p>
      </section>

      <section id="supply-chain" className="article-section">
        <h2>4. Supply chain in three layers</h2>
        <p>
          "Supply chain" on Solana now spans at least three distinct layers,
          each with its own defenses:
        </p>
        <ol>
          <li>
            <strong>Code dependencies</strong> — npm packages (
            <Link to="/incident/solana-web3js-supply-chain-dec-2024">
              @solana/web3.js
            </Link>
            ,{" "}
            <Link to="/incident/kodane-patch-manager-npm-jul-2025">
              @kodane/patch-manager
            </Link>
            ), Cargo crates, IDE extensions. Defense: pinning, signed
            provenance, sandboxed dev environments.
          </li>
          <li>
            <strong>Service dependencies</strong> — staking APIs (
            <Link to="/incident/swissborg-kiln-sol-staking-sep-2025">Kiln</Link>),
            backend signers (
            <Link to="/incident/timefun-backend-signing-mar-2025">Time.fun</Link>),
            error/analytics SDKs (
            <Link to="/incident/slope-wallet-aug-2022">Slope/Sentry</Link>).
            Defense: scoped credentials, on-the-wire instruction validation,
            output scrubbing.
          </li>
          <li>
            <strong>Frontend / web2 dependencies</strong> — DNS and registrar (
            <Link to="/incident/raydium-dns-dec-2022">Raydium</Link>,{" "}
            <Link to="/incident/parcl-dns-aug-2024">Parcl</Link>,{" "}
            <Link to="/incident/bonkfun-dns-mar-2026">BONKfun</Link>),
            social accounts (
            <Link to="/incident/watt-protocol-x-oct-2025">Watt</Link>,{" "}
            <Link to="/incident/swarms-discord-jul-2025">Swarms</Link>).
            Defense: registrar lock, DNSSEC, hardware-2FA on every social
            account.
          </li>
        </ol>
      </section>

      <section id="user-side" className="article-section">
        <h2>5. User-side phishing has become quasi-industrial</h2>
        <p>
          Approval phishing, drainer kits, and malicious claim flows are now a
          steady background noise rather than rare events. Notable patterns:
        </p>
        <ul>
          <li>
            Airdrop claims that bundle a hostile token approval (
            <Link to="/incident/dmt-dexmaxai-airdrop-phishing-nov-2025">
              DMT / dexmaxai
            </Link>
            ).
          </li>
          <li>
            Owner-field reassignment that defeats simulation-based "preview"
            UX.
          </li>
          <li>
            Telegram trading bots and "AI agent" projects with poor key
            handling (
            <Link to="/incident/solareum-telegram-mar-2024">Solareum</Link>,{" "}
            <Link to="/incident/banana-gun-sep-2024">Banana Gun</Link>,{" "}
            <Link to="/incident/dexx-key-leak-nov-2024">DEXX</Link>).
          </li>
          <li>
            X / Discord account takeovers used to broadcast phishing links to a
            real user base.
          </li>
        </ul>
        <p>
          Wallet vendors, dApp developers, and infrastructure providers all
          have a role here: simulation must explain account-ownership changes,
          approval defaults must be bounded, and protocols should publish the
          exact transaction shapes users will be asked to sign.
        </p>
      </section>

      <section id="defender-priorities" className="article-section">
        <h2>6. Defender priorities right now</h2>
        <p>
          If you are building or operating a Solana protocol today, the
          highest-leverage controls — based on what is actually causing losses
          in this period — are:
        </p>
        <ol>
          <li>
            <strong>Authority hygiene and multisig discipline.</strong> No
            single-signer privileged authorities. Multisig signers on
            independent, hardened devices. Mandatory time-locks on changes to
            the council, the upgrade authority, and the collateral whitelist.
          </li>
          <li>
            <strong>Decode every payload.</strong> Multisig signers should
            never approve an opaque blob; require human-readable decoding and
            a second-channel confirmation between independent signers,
            including for durable-nonce transactions.
          </li>
          <li>
            <strong>Endpoint security for anyone who signs.</strong>{" "}
            EDR/managed-detection on contributor laptops; air-gapped or
            transaction-only signing environments; restrict IDE extensions and
            external-repo cloning.
          </li>
          <li>
            <strong>Conservative parameters for novel collateral.</strong> New
            collateral types (PTs, LSTs, RWAs) need bespoke oracle and
            risk-parameter design; copy-paste from blue-chip parameters has
            produced multiple losses.
          </li>
          <li>
            <strong>Out-of-band verification of partners.</strong> BD
            engagements that involve onboarding vault assets, signing test
            transactions, or sharing repos must be verified through
            independent channels — every recent state-actor attack started
            with a friendly counterparty.
          </li>
          <li>
            <strong>Web2 hygiene that matches the on-chain stakes.</strong>{" "}
            Registrar-lock, DNSSEC, CAA records, hardware-2FA on social
            accounts, IPFS-pinned mirrors of the production frontend.
          </li>
          <li>
            <strong>Continuous monitoring.</strong> On-chain monitors for
            authority changes, abnormal outflows, and oracle deviations;
            web2 monitors for cert-transparency events and DNS changes; off-chain
            monitors for fund custody and reserve ratios.
          </li>
        </ol>
        <p>
          The companion{" "}
          <Link to="/checklist">security checklist</Link> turns these themes
          into concrete configuration and process items.
        </p>
      </section>
    </article>
  );
}
