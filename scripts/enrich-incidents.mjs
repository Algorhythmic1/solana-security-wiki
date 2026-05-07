#!/usr/bin/env node
// Augments each incident in src/data/incidents.json with `lesson` and `mitigations`.
// Skips entries with severity === "informational" for mitigations.
// Idempotent: existing values are preserved unless --force is passed.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, "../src/data/incidents.json");

const FORCE = process.argv.includes("--force");

/** @type {Record<string, { lesson?: string; mitigations?: string[] }>} */
const ENRICH = {
  "solana-turbine-bug-dec-2020": {
    lesson:
      "Block-propagation paths are part of consensus; treating distinct blocks for the same slot as identical was the root failure. Network resilience needs structured fault propagation, not just retries.",
    mitigations: [
      "Identify blocks by hash, not by slot number alone, throughout block-propagation logic.",
      "Propagate fault-detection events over gossip so all validators learn about partitions quickly.",
      "Run client-diversity testing against synthetic forks before shipping consensus changes.",
      "Maintain documented validator-coordination playbooks (snapshot, restart slot, contacts) reachable out-of-band.",
    ],
  },
  "solend-auth-bypass-aug-2021": {
    lesson:
      "Privileged Solana instructions must enforce both account ownership and signer constraints; trusting a passed-in 'authority' account is the canonical Solana account-confusion bug.",
    mitigations: [
      "Require that the config authority be a signer and match the canonical PDA/multisig for the market.",
      "Scope each admin instruction to the smallest possible account set and assert program ownership of every account it reads or writes.",
      "Add real-time monitoring for parameter changes (LTV, liquidation bonus) with alerts to a security on-call rotation.",
      "Implement governance time-locks and circuit breakers (e.g., a Brick-style emergency pause) for any reserve-config change.",
      "Run negative-path fuzzing against admin instructions in CI so attacker-crafted accounts are part of regression tests.",
    ],
  },
  "grape-protocol-ido-sep-2021": {
    lesson:
      "Performance-first L1s need explicit congestion controls and graceful-degradation paths for legitimate-but-extreme load, not just spam protection.",
    mitigations: [
      "Apply runtime per-account write-lock and compute-unit limits to bound damage from hot accounts.",
      "Use stake-weighted QoS and priority/local fee markets to ensure vote and critical-protocol traffic gets through.",
      "Switch transaction ingress from raw UDP to QUIC with admission control.",
      "Have an automated, signed snapshot/restart pipeline for validators rather than ad-hoc Discord coordination.",
      "Application teams should treat network-stall risk as a first-class scenario in liquidations, oracle freshness checks, and refund logic.",
    ],
  },
  "spl-token-lending-rounding-2021": {
    lesson:
      "Shared library code needs the same scrutiny as bespoke programs, and 'small' rounding bugs become economically large under Solana's high transaction throughput and instruction batching.",
    mitigations: [
      "Use floor (not round) consistently for outflows; assert no transaction can withdraw more value than it deposited at the same exchange rate.",
      "Add property-based / invariant tests that randomize batch sizes and exchange rates to detect drift.",
      "Run formal-style invariant checks (e.g., SeaHorse, MoveProver-style, or hand-written invariants) against deposit/redeem pairs.",
      "Coordinate disclosure across forks early; maintain an SPL-fork registry so patches can be propagated quickly.",
      "Track a 'shadow accounting' offline reconciliation job that flags discrepancies between expected and on-chain balances.",
    ],
  },
  "jet-protocol-c-ratio-dec-2021": {
    lesson:
      "Whitehat-discoverable bugs in collateral math demonstrate the value of pre-mainnet adversarial review, internal red-teaming, and a tight responsible-disclosure pipeline.",
    mitigations: [
      "Maintain a funded bug bounty (Immunefi or equivalent) with clear scope before TVL grows.",
      "Require multi-party code review for any PR touching collateral, interest, or oracle math.",
      "Add invariant tests that assert C-ratio computations cannot understate liabilities or overstate collateral under any input.",
      "Provide a private security channel and PGP key for disclosures, with a 24-hour acknowledgement SLA.",
    ],
  },
  "wormhole-bridge-feb-2022": {
    lesson:
      "Solana sysvars and program IDs must be verified by address, not by structural shape. Patch-gap risk on public repos means deployment must follow disclosure within hours, not days.",
    mitigations: [
      "Validate every sysvar account by hardcoded address (e.g. the canonical Instructions sysvar pubkey), not by passed-in input.",
      "Replace deprecated helpers (`load_instruction_at`) with verified, well-typed equivalents and lint deprecated APIs in CI.",
      "Treat any commit touching guardian/signature logic as security-sensitive; coordinate the merge, audit, and on-chain upgrade in a single window.",
      "Set up out-of-band monitoring for unexpected mints on bridge wrap mints and trip a circuit breaker on threshold breaches.",
      "Limit the per-message and per-window mint ceilings (a 'governor') so a single forged VAA cannot mint hundreds of millions in one transaction.",
    ],
  },
  "cashio-infinite-mint-mar-2022": {
    lesson:
      "Collateral programs must verify both the token mint and the program that owns the deposited LP, and stablecoin issuers should bound how fast supply can grow regardless of inputs.",
    mitigations: [
      "Whitelist exact mint addresses for accepted collateral and verify the LP token's program owner on every deposit.",
      "Cap mint throughput per block, per hour, and per day to bound infinite-mint blast radius.",
      "Independently audit any new collateral type before listing; require a separate review of the verification path, not only happy-path tests.",
      "Continuously reconcile total CASH supply against expected backing; alert and halt mint on any drift.",
      "Provide a backstop / insurance fund sized for plausible exploit scenarios and a documented refund mechanic.",
    ],
  },
  "crema-flash-loan-jul-2022": {
    lesson:
      "Concentrated-liquidity AMMs have many program-derived data accounts whose authenticity must be verified; a single missed check becomes a flash-loan-amplified drain.",
    mitigations: [
      "Derive tick accounts from canonical PDAs and assert PDA derivation on every read.",
      "Reject any tick or position account whose program owner is not the AMM program itself.",
      "Add invariant tests that 'no swap can produce fees larger than swap input' and run them with adversarial inputs.",
      "Rate-limit fee withdrawals from any single account in a single transaction.",
      "Subscribe pools to onchain monitoring (Hypernative, Range, Forta-style) for sudden fee-claim spikes.",
    ],
  },
  "audius-governance-jul-2022": {
    lesson:
      "DAO governance code is just as critical as the token logic it controls; proposal execution must be sandboxed and time-locked.",
    mitigations: [
      "Strict allow-list of instructions a passed proposal can execute against the treasury.",
      "Time-lock between proposal pass and execution sized so the community and a security council can intervene.",
      "Independent audit of governance and timelock contracts on every upgrade.",
      "A security council with veto rights over proposals that touch treasury authority or token mint.",
      "Continuous monitoring for new proposals affecting privileged accounts, with off-chain alerts.",
    ],
  },
  "nirvana-flash-loan-jul-2022": {
    lesson:
      "Algorithmic stablecoins built on internal price curves are flash-loan magnets; collateral pricing must come from manipulation-resistant external feeds.",
    mitigations: [
      "Use an external, multi-source oracle (Pyth/Switchboard) with confidence intervals, never instantaneous internal pool spot.",
      "Apply TWAPs over multiple blocks for any price input that drives mint or borrow capacity.",
      "Cap per-block mint and per-block treasury outflow regardless of nominal collateral value.",
      "Stress-test the bonding curve and treasury under simulated flash-loan scenarios pre-launch.",
      "Require minimum diversified treasury composition so a single asset's manipulation cannot drain all backing.",
    ],
  },
  "candy-machine-outage-apr-2022": {
    lesson:
      "Hot-account write contention plus undifferentiated UDP ingest is a recipe for outages; mint mechanics need built-in spam disincentives.",
    mitigations: [
      "Enable a 'bot tax' on failed mint instructions so brute-force attempts have economic cost.",
      "Move ingress to QUIC with stake-weighted QoS and per-IP rate limits.",
      "Use account locality / multiple parallel mint accounts to reduce write-lock contention on any single PDA.",
      "Pre-test launches against synthetic mint floods on devnet before mainnet rollout.",
    ],
  },
  "solend-whale-governance-jun-2022": {
    lesson:
      "Concentration risk is a pre-failure mode that does not require any code bug; lending-market parameters must include hard caps and emergency response must respect 'mutability' norms users were sold.",
    mitigations: [
      "Per-user borrow caps and per-asset deposit caps from launch, sized to DEX depth at expected slippage.",
      "Isolate volatile or thinly-traded collateral into separate, smaller lending markets (Aave-style isolation mode).",
      "Pre-publish a stressed-market playbook (pause, limit liquidation size per tx, communicate timelines) before relying on emergency governance.",
      "Cap the impact of any single voting wallet via vote weighting or quorum rules so emergency votes are not 88%-controlled by one address.",
      "Maintain off-chain OTC liquidation desk relationships so large positions can be unwound without crashing on-chain markets.",
    ],
  },
  "slope-wallet-aug-2022": {
    lesson:
      "Wallet client code must treat seed phrases as nuclear material; analytics and crash reporters must be configured to scrub aggressively, and ideally never even see secrets.",
    mitigations: [
      "Architect wallets so seed material never leaves the secure enclave / OS keystore in any code path.",
      "Configure error-tracking SDKs (Sentry et al.) with allow-lists, not deny-lists; assume default capture is unsafe.",
      "Run static analysis to detect any path that logs or transmits values matching mnemonic/key patterns.",
      "Annual third-party app pentests (mobile and extension) covering data egress, not only smart-contract calls.",
      "Push users toward hardware-wallet pairing for non-trivial balances; surface a clear in-app warning above a threshold.",
    ],
  },
  "optifi-program-close-aug-2022": {
    lesson:
      "Solana program management is unforgiving: `solana program close` is irreversible and will strand all PDAs derived from that program. Treat all program-management commands like production rm -rf.",
    mitigations: [
      "Place the upgrade authority on a multisig (Squads) requiring N-of-M approval before any deployment.",
      "Maintain a deployment runbook with explicit, peer-reviewed commands; never paste destructive commands into a shared shell.",
      "Use environment isolation (separate keypairs and CLI configs for dev/staging/mainnet) so wrong-target mistakes are harder.",
      "Build a 'dry-run' / simulation step for `solana program close`-class operations.",
      "Maintain on-call peer review for any program upgrade, with two human approvers.",
    ],
  },
  "mango-markets-oracle-oct-2022": {
    lesson:
      "Thin-liquidity collateral combined with permissive cross-margin and capital-efficient borrowing is an oracle-manipulation invitation, even when the oracle itself works as designed.",
    mitigations: [
      "Set per-asset borrow caps inversely proportional to spot DEX depth at acceptable slippage.",
      "Use price feeds with confidence intervals and reject prices whose interval widens beyond a threshold.",
      "Apply TWAP/VWAP windows for collateral valuation that exceed the cost of moving spot for that window.",
      "Limit cross-collateralization for low-cap governance tokens; isolate them from major-asset liquidity.",
      "Implement circuit breakers that auto-pause borrowing when a single asset's mark moves more than X% in Y minutes.",
    ],
  },
  "uxd-mango-contagion-oct-2022": {
    lesson:
      "Composability is contagion. Any treasury or backing position deposited into a third-party protocol inherits that protocol's full failure surface.",
    mitigations: [
      "Diversify backing across multiple protocols and venue types; cap exposure to any single counterparty.",
      "Maintain an insurance fund explicitly sized for plausible third-party freezes or losses.",
      "Continuously monitor counterparties and pre-define automatic withdrawal triggers (e.g., on counterparty pause).",
      "Pre-publish a redemption playbook so users know what backing assumptions hold during third-party incidents.",
    ],
  },
  "tulip-mango-contagion-oct-2022": {
    lesson:
      "Yield aggregators must explicitly model and disclose third-party risk; a vault is only as safe as its furthest hop.",
    mitigations: [
      "Whitelist target venues and require new integrations to pass an internal security review.",
      "Cap allocations per third-party protocol with a per-vault and global limit.",
      "Subscribe to upstream incident channels (status pages, Twitter, on-chain pause oracles) and auto-pause withdrawals on alert.",
      "Make vault risk parameters visible in the UI so depositors understand counterparty exposure.",
    ],
  },
  "solend-oracle-nov-2022": {
    lesson:
      "Isolated lending pools accept by definition niche collateral; their oracle and parameter assumptions need stress-testing under thin-liquidity conditions.",
    mitigations: [
      "Use multi-source oracles with strict staleness checks (e.g., reject prices older than N slots).",
      "Set very conservative LTV and borrow caps for isolated pools; raise only with on-chain governance and time-lock.",
      "Add per-block liquidation rate-limits to prevent cascade events.",
      "Maintain a treasury insurance line specifically earmarked for isolated-pool bad debt.",
    ],
  },
  "raydium-pool-owner-key-dec-2022": {
    lesson:
      "Hot upgrade authorities and admin pubkeys are single points of failure; key compromise on a privileged signer is indistinguishable from a smart-contract bug from the user's perspective.",
    mitigations: [
      "Move all program upgrade and admin authorities to a hardware-backed multisig (Squads with HSM/Ledger signers).",
      "Eliminate or strictly bound admin instructions: parameters that could drain pools should not exist as a single-signature call.",
      "Continuously monitor on-chain authority changes and admin-only instructions; alert immediately on anomalies.",
      "Rotate signer devices and maintain endpoint-protection / EDR on any machine that ever holds a hot key.",
      "Limit per-pool withdrawal velocity for fee/PNL claim instructions.",
    ],
  },
  "raydium-dns-dec-2022": {
    lesson:
      "Web2 supply chain (registrar, DNS provider, hosting) is part of a Solana protocol's attack surface; smart-contract security is moot if users sign on a counterfeit frontend.",
    mitigations: [
      "Enable registrar lock, DNSSEC, and hardware-2FA on all registrar and DNS provider accounts.",
      "Use a CAA record to constrain which CAs can issue certs for the domain.",
      "Pin frontend assets via IPFS/ENS/Arweave and provide a checksum-verifiable alternate entry point.",
      "Operate a status page and X account that users can verify against; publish the canonical domain in protocol metadata.",
      "Push wallet partners to surface domain-level reputation and warn on first-seen / recently-changed ownership.",
    ],
  },
  "durable-nonce-outage-jun-2022": {
    lesson:
      "Niche but powerful runtime features need conservative defaults and broad differential testing across clients before mainnet exposure.",
    mitigations: [
      "Differential-fuzz feature interactions (nonce x recent-blockhash x replay) across multiple validator clients.",
      "Gate new runtime features behind feature-flag activation with clear rollback paths.",
      "Maintain fast-disable kill switches for non-essential features that can be triggered in a single coordinated release.",
      "Encourage client diversity (Agave, Firedancer, Jito-Solana) so a runtime bug does not affect the entire stake.",
    ],
  },
  "duplicate-block-outage-sep-2022": {
    lesson:
      "Fork-choice corner cases (especially around a validator's own last vote) need explicit modeling; a single faulty leader should not strand the cluster.",
    mitigations: [
      "Improve fork-choice logic so validators can switch to a heavier fork even when it overlaps their last voted slot.",
      "Slash or down-rank validators that produce duplicate blocks.",
      "Add prioritized vote-transaction processing so consensus traffic is not crowded out during stress.",
      "Run chaos/Jepsen-style consensus tests that induce duplicate-block scenarios.",
    ],
  },
  "turbine-giant-block-feb-2023": {
    lesson:
      "Block propagation with naive deduplication can be DoSed by oversized or rapidly re-forwarded shreds; networking and consensus must defend against pathological producers.",
    mitigations: [
      "Cap block size and shred count; reject and slash producers exceeding the limit.",
      "Strengthen Turbine deduplication and use bloom filters / probabilistic structures with stable behavior under flood.",
      "Move to QUIC for shred propagation with explicit flow control.",
      "Adopt strict shred-forwarding rules to prevent forwarding loops.",
    ],
  },
  "marginfi-oracle-mar-2023": {
    lesson:
      "Oracle integration is an active engineering responsibility, not a one-time configuration; thin-liquidity collateral magnifies every mistake.",
    mitigations: [
      "Reject stale prices using `getPriceNoOlderThan`-style helpers; treat 'no price' as 'no borrow'.",
      "Use confidence intervals (Pyth) as a hard-cap on borrow capacity for that asset.",
      "Set very low LTV and borrow caps for thinly-traded collateral; isolate them so contagion is bounded.",
      "Add automated alerting on bad-debt accrual and oracle deviation.",
    ],
  },
  "cypher-protocol-aug-2023": {
    lesson:
      "Recovery mechanisms and recovery custodians are also exploit targets; insider threat is part of the model. Treat funds in a 'redemption pot' with the same custody discipline as user deposits.",
    mitigations: [
      "Run an external audit (Neodyme, OtterSec, Halborn, Sec3) before relying on perps/margin program logic.",
      "Manage recovery / redemption funds through a multisig with independent signers, not a single contributor.",
      "Background-check and rotate access for anyone with privileged keys; enforce least-privilege.",
      "Publish on-chain accounting for redemption funds so any movement is publicly visible.",
    ],
  },
  "svt-flash-loan-aug-2023": {
    lesson:
      "Token economic loops that allow round-tripping in a single transaction are flash-loan-vulnerable; modeling token flows under attacker control is part of the audit scope.",
    mitigations: [
      "Disallow same-transaction sequences that round-trip through fee/discount paths in profit-positive ways.",
      "Apply per-block trade limits or cooldowns on tokens with custom economic mechanics.",
      "Audit economic invariants explicitly: total value out across all paths cannot exceed total value in for the same actor in one transaction.",
      "Maintain monitoring for sudden token supply or pool ratio shifts.",
    ],
  },
  "synthetify-dao-oct-2023": {
    lesson:
      "Inactive DAOs are hostile environments: low quorums and absent monitoring make malicious-proposal attacks trivial.",
    mitigations: [
      "Set high quorum thresholds and minimum participation; raise them automatically as a function of treasury size.",
      "Add a security council with veto power on proposals affecting treasuries.",
      "Notify token holders of every new proposal via off-chain channels (email/Telegram bot/Discord).",
      "Time-lock any proposal that touches treasury or program upgrade authorities.",
    ],
  },
  "thunder-terminal-dec-2023": {
    lesson:
      "Backend secret hygiene is a first-class wallet-security control. A leaked database connection string is equivalent to handing over the key custody pipeline.",
    mitigations: [
      "Store database credentials and signing keys in a managed KMS / secrets manager with short-lived tokens, not in env files or code.",
      "Network-isolate the signing service from the user-facing API; require mTLS between them.",
      "Rotate credentials regularly and on any suspected compromise; log all signing requests with client identity.",
      "Implement per-user spend velocity limits and require fresh auth for unusual flows.",
      "Maintain a one-click 'pause withdrawals' kill switch operable by on-call engineers.",
    ],
  },
  "aurory-syncspace-dec-2023": {
    lesson:
      "Hybrid on-chain/off-chain inventory systems must treat the API as a financial system; race conditions and double-spend are the norm without explicit serialization.",
    mitigations: [
      "Use database transactions with row-level locks (SELECT ... FOR UPDATE) on inventory-mutating endpoints.",
      "Make purchase endpoints idempotent via client-supplied request IDs and server-side dedup.",
      "Audit scope must include backend / API code, not just the on-chain program.",
      "Add anomaly detection on rapid same-account requests and rate-limit per account.",
      "Reconcile off-chain ledger against on-chain state continuously; alert on any mismatch.",
    ],
  },
  "jito-website-ddos-dec-2023": {
    lesson:
      "Web infrastructure is part of the user-experience attack surface for high-profile launches even when funds remain safe on-chain.",
    mitigations: [
      "Front-load airdrop claim sites with a CDN/DDoS provider (Cloudflare, Fastly) and load-test under realistic spike conditions.",
      "Publish multiple independent claim entry points (CLI, IPFS-hosted UI) so a single domain failure is not blocking.",
      "Provide an IPFS / Arweave fallback for the claim UI.",
      "Communicate proactively about infrastructure status during high-traffic events.",
    ],
  },
  "saga-dao-multisig-jan-2024": {
    lesson:
      "Multisig threshold and signer hygiene matter more than token holdings; a 1-of-N threshold is a single signer.",
    mitigations: [
      "Use a meaningful threshold (e.g., 4-of-7 minimum for treasury) with geographically distributed, independently controlled signers.",
      "Hardware-wallet every signer; require periodic re-attestation.",
      "Audit and publish the signer list and threshold; rotate signers on any departure.",
      "Add transaction-simulation and human-readable previews for every multisig proposal.",
    ],
  },
  "phantom-ddos-feb-2024": {
    lesson:
      "Wallet RPC infrastructure is a critical dependency for the entire ecosystem; airdrop and launch days predictably amplify load.",
    mitigations: [
      "Use multi-region, autoscaling RPC infrastructure with rate-limit shaping per IP.",
      "Decouple the wallet UI from a single RPC provider; allow user-configurable endpoints.",
      "Pre-stage capacity and run game-day load tests ahead of known events.",
      "Provide degraded read-only modes when signing infrastructure is throttled.",
    ],
  },
  "solana-jit-cache-outage-feb-2024": {
    lesson:
      "Backwards-compatibility code paths (legacy loaders) need test coverage equal to the modern ones; cache invariants should be exercised under fork conditions.",
    mitigations: [
      "Add deterministic JIT-cache fork tests in CI and devnet.",
      "Treat legacy loader code as security-sensitive surface; minimize and eventually deprecate it.",
      "Maintain multiple validator client implementations so a single client bug cannot stall the cluster.",
      "Pre-distribute hotfix release pipelines so patched validators can roll out within minutes.",
    ],
  },
  "solareum-telegram-mar-2024": {
    lesson:
      "Telegram trading bots that hold or import user keys are full custodians; they need bank-grade key custody and developer vetting, which most do not have.",
    mitigations: [
      "Avoid custodial key models entirely; use session keys with strict scoped authority instead of full private keys.",
      "If keys must be held, store in HSMs/KMS with per-user encryption envelopes.",
      "Background-check developers and limit production access; rotate credentials on every offboard.",
      "Continuous monitoring for unusual mass-withdrawal patterns; auto-pause on anomaly.",
      "Publish a third-party security audit before accepting user funds.",
    ],
  },
  "ionet-gpu-spoofing-apr-2024": {
    lesson:
      "Decentralized infrastructure registrations are an attack surface; without verifiable proof-of-resource, spoofing inflates network metrics and degrades quality.",
    mitigations: [
      "Require cryptographic proof-of-work or proof-of-resource attestations from each worker.",
      "Use TEEs / signed hardware attestations (e.g., NVIDIA confidential compute, SEV-SNP) where possible.",
      "Monitor for duplicate hardware fingerprints and unrealistic registration spikes.",
      "Apply staking/slashing for misreporting workers.",
    ],
  },
  "pumpfun-insider-may-2024": {
    lesson:
      "Insider threats demand the same controls as external attackers; privileged employee access combined with a flash-loan-borrowable bonding curve was a single-employee draining scenario.",
    mitigations: [
      "Eliminate any single-signer privileged authority; route every privileged action through multisig with independent reviewers.",
      "Implement separation of duties between code authorship and deployment.",
      "Audit log every privileged action with immutable storage and out-of-team review.",
      "Add invariant checks that bonding-curve liquidity cannot be withdrawn without explicit user-initiated trigger.",
      "Run periodic insider-threat tabletop exercises.",
    ],
  },
  "parcl-dns-aug-2024": {
    lesson:
      "Frontend takeover is increasingly common; DeFi sites need the same registrar/DNS hygiene as banks.",
    mitigations: [
      "Registrar-lock the domain and enable DNSSEC.",
      "Hardware-2FA on all registrar / DNS / hosting accounts; restrict access to a small trained group.",
      "Use a CAA DNS record to whitelist certificate authorities.",
      "Subscribe to certificate-transparency monitoring to alert on new cert issuance.",
      "Provide an IPFS-pinned mirror and document it in the project's official channels for fallback verification.",
    ],
  },
  "solana-elf-alignment-aug-2024": {
    lesson:
      "Coordinated, private patching for runtime vulnerabilities is a maturity milestone; the playbook must already exist before it's needed.",
    mitigations: [
      "Maintain a private security disclosure pipeline with the Foundation, Anza, Firedancer, and major staking operators.",
      "Pre-stage validator-side hotfix distribution channels with key-pinned signed releases.",
      "Encourage diverse validator clients so a runtime issue can be partly mitigated by alternative implementations.",
      "Test critical patches on devnet/testnet validators before mainnet rollout.",
    ],
  },
  "banana-gun-sep-2024": {
    lesson:
      "Trading bots that broker between Telegram messages and on-chain transactions are signing oracles; the message channel is part of the auth surface.",
    mitigations: [
      "Authenticate Telegram message provenance; reject messages with mismatched session or origin.",
      "Add a transfer cool-down period for outbound user transfers and second-channel confirmation for large amounts.",
      "Mandatory 2FA for any non-trading withdrawal action.",
      "Continuous monitoring for mass simultaneous transfers and auto-pause on anomaly.",
      "Independent third-party audit covering the message-handling path, not only the on-chain program.",
    ],
  },
  "dexx-key-leak-nov-2024": {
    lesson:
      "Centralized custody of user private keys is a regulated activity in everything but name; mishandling keys at any layer becomes a chain-of-custody failure.",
    mitigations: [
      "Avoid custodial private-key models in favor of MPC or non-custodial signing.",
      "If custody is required, store keys in HSM/KMS with per-user envelopes and never display in plaintext to operators.",
      "Encrypt every export endpoint output; require step-up auth and rate-limit exports.",
      "Continuous outbound monitoring for mass-withdrawal patterns; circuit-break at thresholds.",
      "Publish reserve attestations and SOC 2 / equivalent third-party reviews.",
    ],
  },
  "solana-web3js-supply-chain-dec-2024": {
    lesson:
      "JavaScript dependency trees are a critical link in Solana dApp security; a single phished publish token can backdoor thousands of downstream apps.",
    mitigations: [
      "Pin npm dependency versions and use lockfiles; require explicit upgrades with review.",
      "Enable npm 2FA + provenance / sigstore signing for all maintainers.",
      "Use `npm audit signatures` and a CI step that fails on signature mismatch.",
      "Run dependency-monitoring tools (Socket.dev, Snyk, GitHub Dependabot) and respond to advisories within 24 hours.",
      "Avoid handling raw private keys in dApp frontends; use wallet adapters / signTransaction patterns so a backdoored library cannot exfiltrate keys.",
    ],
  },
  "noones-bridge-jan-2025": {
    lesson:
      "Hot-wallet driven bridges combined with permissive small-transfer flows create thousands of low-friction exits an attacker can chain together.",
    mitigations: [
      "Apply per-window aggregate limits across the entire hot wallet, not just per-transaction.",
      "Velocity-based anomaly detection that triggers automated pause on unusual cross-chain outflow rates.",
      "Hot/cold split with strict refill discipline and human approval above thresholds.",
      "Separate signing infrastructure per chain and require step-up auth for cross-chain transfers.",
    ],
  },
  "npm-malware-jan-2025": {
    lesson:
      "Typosquatting and malicious packages targeting Solana developers are a continuous, low-effort attack vector; defense relies on standard supply-chain hygiene applied consistently.",
    mitigations: [
      "Lock dependency versions and forbid wildcard ranges in production builds.",
      "Use organization-scoped packages and verify publisher identity.",
      "Run a software composition analysis (SCA) tool in CI on every PR.",
      "Sandbox developer machines; never sign mainnet transactions from a workstation that pulls arbitrary npm packages without review.",
    ],
  },
  "timefun-backend-signing-mar-2025": {
    lesson:
      "Shared backend co-signers are escalation-of-privilege bugs waiting to happen if they sign anything other than narrowly validated transactions.",
    mitigations: [
      "Architect signing services to validate the exact instruction shape and account set before signing.",
      "Separate the wallet that pays gas from the wallet that owns valuable assets.",
      "Require transaction simulation against a strict allow-list policy before any backend signature.",
      "Treat 'sign arbitrary user transaction' as a privileged operation; require multi-party approval.",
      "Publish formal documentation of what the co-signer is and is not allowed to sign.",
    ],
  },
  "loopscale-oracle-apr-2025": {
    lesson:
      "Novel collateral types (principal tokens, LSTs, RWA wrappers) need oracle and risk-parameter design from scratch; copy-pasting LTVs from blue-chip assets is dangerous.",
    mitigations: [
      "Run a separate oracle architecture for novel collateral types; use TWAPs and external feeds, not internal AMM marks.",
      "Conservative initial caps and LTVs for any new collateral; raise only after stress-test and live observation.",
      "Stress-test the entire collateral stack against flash-loan and liquidity-shock scenarios pre-launch.",
      "Publish a public risk dashboard and bounty program with clear scope.",
      "Maintain a quick-pause mechanism callable by a multisig within minutes.",
    ],
  },
  "texture-lending-jul-2025": {
    lesson:
      "Vault validation paths are the highest-leverage code in a lending protocol; they deserve invariants and adversarial testing, not just unit tests.",
    mitigations: [
      "Property-based testing of vault deposit/withdraw/redeem under adversarial inputs.",
      "Independent audit covering edge-case validation, not only happy paths.",
      "Real-time monitoring on vault TVL with automated pause on sudden large outflows.",
      "Public bug bounty with payout floor that incentivizes whitehat reports over exploitation.",
    ],
  },
  "swarms-discord-jul-2025": {
    lesson:
      "Discord and other community platforms are part of the security perimeter; one phished moderator can disrupt thousands of users.",
    mitigations: [
      "Hardware-2FA mandatory for every moderator and admin role.",
      "Use role-scoped permissions; only a few accounts should have channel-deletion or member-removal powers.",
      "Train team members to expect DM-based phishing and verify any 'support' DM out-of-band.",
      "Configure audit-log alerting (e.g., Wick bot) for destructive admin actions.",
    ],
  },
  "kodane-patch-manager-npm-jul-2025": {
    lesson:
      "AI-assisted package generation lowers the cost of creating convincing malicious packages; supply-chain controls are now more important, not less.",
    mitigations: [
      "Pin dependency versions and review every new package added to the manifest.",
      "Use automated SCA / typosquatting detection in CI.",
      "Restrict which workstations can install dependencies for production builds.",
      "Avoid handling raw keys in any process that loads npm packages; route signing through a separate, hardened service.",
    ],
  },
  "credix-rug-aug-2025": {
    lesson:
      "Single admin keys with mint and pool-drain authority are indistinguishable from rug-pull infrastructure regardless of the team's intent.",
    mitigations: [
      "Move every privileged authority to multisig with independent, doxxed signers from launch.",
      "Time-locked governance for any change to core program addresses or token mint authorities.",
      "Publish on-chain proof of treasury composition and any movements.",
      "Independent third-party audits made public before TVL grows.",
      "Provide explicit user-protection mechanisms (insurance fund, withdrawal queue, emergency pause).",
    ],
  },
  "swissborg-kiln-sol-staking-sep-2025": {
    lesson:
      "Staking-as-a-service APIs are a giant trust boundary; a stolen integration token can rewrite stake-account authority across many institutional clients at once.",
    mitigations: [
      "Decode and human-verify every instruction in any inbound transaction touching stake authority before signing.",
      "Reject any unstake transaction containing more than the expected number of instructions.",
      "Keep stake-account authority on a multisig with a different trust domain than the staking-API integration token.",
      "Use scoped, short-lived API credentials (with mTLS) and rotate on any incident at the provider.",
      "Continuously reconcile expected stake authorities against on-chain state and alert on drift.",
    ],
  },
  "aqua-rug-sep-2025": {
    lesson:
      "Promotion by reputable infra teams is not a security signal; due diligence on tokenomics and key custody is independent of who tweets a project.",
    mitigations: [
      "Investors and platforms should require a published key-custody and upgrade-authority disclosure before integration.",
      "Look for time-locked vesting and on-chain proof of the reported tokenomics.",
      "Verify multisig configuration on-chain (signers, threshold) before listing or partnering.",
      "Maintain a public 'safety review' framework similar to Solana Foundation Stride for new projects.",
    ],
  },
  "watt-protocol-x-oct-2025": {
    lesson:
      "Project X accounts are a primary phishing distribution channel; their compromise turns a real audience into victims within minutes.",
    mitigations: [
      "Hardware-2FA, password-manager-stored unique passwords, and verified-credentials backup codes.",
      "Restrict X access to a small group; separate posting accounts from admin accounts.",
      "Use approved-app monitoring; revoke unused integrations.",
      "Pre-establish secondary verified channels (Discord announcement channel, on-chain message) for users to cross-reference.",
    ],
  },
  "doodipals-key-leak-oct-2025": {
    lesson:
      "NFT projects accumulate substantial treasury without commensurate operational security; private keys must be hardware-backed regardless of project size.",
    mitigations: [
      "Hardware wallets (Ledger / Trezor) for all project signing keys; never store keys on workstations or cloud services.",
      "Multisig (Squads) for treasury and mint authorities.",
      "Off-chain reconciliation: treat the treasury like a small bank, with regular balance attestation.",
      "Avoid mixing project signing keys with personal wallets, ever.",
    ],
  },
  "dmt-dexmaxai-airdrop-phishing-nov-2025": {
    lesson:
      "Airdrop claim flows are now standard phishing bait; users are conditioned to sign messages and approve token interactions during claims.",
    mitigations: [
      "Wallets should highlight token-approval transactions as high-risk and require an additional confirmation.",
      "Users should claim only from explicitly verified URLs and bookmark them in advance.",
      "Token-approval transactions should default to bounded amounts, not unlimited.",
      "Browser-extension defenses (Scam Sniffer, GoPlus Wallet Guard) should be installed as a second line of defense.",
      "Project teams running airdrops should publish exact transaction shapes users will be asked to sign so that wallets and educators can verify.",
    ],
  },
  "upbit-sol-hot-wallet-nov-2025": {
    lesson:
      "Exchange hot wallets are perpetual attack targets; defense-in-depth includes withdrawal velocity controls and rapid pause infrastructure across every supported chain, including Solana.",
    mitigations: [
      "Strict hot-cold split with daily refill ceilings sized to expected daily flow only.",
      "Per-chain monitoring for unusual outflow patterns; auto-pause withdrawals on threshold breach.",
      "MPC custody for hot-wallet signing rather than raw private keys on a single host.",
      "Separate signing key pools per blockchain so a compromise on one chain cannot drain others.",
      "Practice annual incident-response drills covering Solana-specific quirks (e.g., SPL token handling, durable nonces).",
    ],
  },
  "solana-owner-field-phishing-late-2025": {
    lesson:
      "Solana's account model lets transaction-simulation present harmless previews while reassigning account ownership; wallets and users need new mental models for what to verify.",
    mitigations: [
      "Wallets should explicitly decode and warn on `SystemProgram::Assign`, `Token::SetAuthority`, and any instruction that changes program ownership of a user account.",
      "Show a security-focused diff in transaction previews (account owner changes, new authority pubkey) regardless of asset transfer.",
      "Educate users that 'no token movement in simulation' is not 'safe transaction'.",
      "dApp developers should never request signatures for instructions that reassign ownership unless absolutely required, and should explain why.",
      "Browser security extensions should ship explicit detection for these patterns.",
    ],
  },
  "solar-solana-zh-x-jan-2026": {
    lesson:
      "Community-language X accounts are high-trust targets; their compromise affects regional user bases that may not have the same English-speaking signals.",
    mitigations: [
      "Apply the same hardware-2FA / password-manager / restricted-access policies to localized social accounts as to the main account.",
      "Cross-post critical announcements between the global and local accounts so users have a verifiable second source.",
      "Maintain a doxxed point of contact for each localized account to support recovery.",
    ],
  },
  "step-finance-treasury-jan-2026": {
    lesson:
      "Endpoint compromise on executive devices is the most common path to large losses today; assume any device can be compromised and design custody so a single device cannot move funds.",
    mitigations: [
      "Use hardware wallets in air-gapped or transaction-approval-only setups; never sign from a general-purpose laptop.",
      "Require multisig threshold > 1 for any treasury action; isolate signers across distinct environments.",
      "Deploy EDR / managed-detection on all executive endpoints; restrict admin software install.",
      "Regular phishing and malware-defense training for all team members with privileged access.",
      "Off-chain monitoring for unexpected stake-authority changes with a circuit breaker that requires multi-party reauthorization.",
    ],
  },
  "stake-nova-flash-loan-feb-2026": {
    lesson:
      "Liquid-staking redeem paths involve multiple accounting checks; a single missed validation under flash-loan conditions can drain user deposits in one transaction.",
    mitigations: [
      "Property-based testing of redeem paths under adversarial inputs and flash-loan composition.",
      "Independent audit before launch; every external integration adds attack surface.",
      "Per-block redeem rate limits to bound flash-loan damage.",
      "Real-time monitoring on TVL and pool ratios with auto-pause on anomalies.",
      "Maintain a public bounty floor large enough to incentivize disclosure rather than exploitation.",
    ],
  },
  "bonkfun-dns-mar-2026": {
    lesson:
      "Domain registrars themselves can be socially engineered out of customer accounts; protocol teams must defend not just at the registrar account level but at the registrar selection level.",
    mitigations: [
      "Use registrars with hardware-2FA, registrar-lock, and human-confirmed transfer policies.",
      "Enable DNSSEC and CAA records.",
      "Pre-publish a recovery process and out-of-band channels (Discord, X, on-chain) so users have a verifiable secondary source if the domain is hijacked.",
      "Monitor certificate transparency logs and DNS records continuously; alert on unauthorized changes.",
      "Maintain an IPFS / Arweave-pinned mirror for the production frontend.",
    ],
  },
  "drift-protocol-apr-2026": {
    lesson:
      "Sophisticated DPRK-style social engineering against contributors and multisig signers is now the largest loss vector in DeFi; controls must include human-process security, signer hygiene, and durable-nonce awareness alongside smart-contract audits.",
    mitigations: [
      "Treat any pre-signed transaction (including durable nonces) as a long-lived signed authorization; track which nonces are outstanding and restrict their reuse.",
      "Require human-readable decoding of every multisig payload and out-of-band confirmation between independent signers before approval.",
      "Mandatory minimum timelock on Security Council changes (no zero-timelock migrations) and on collateral whitelist changes.",
      "Strict allow-list for new collateral assets with multi-day cooling period and on-chain governance vote.",
      "Air-gap signing from internet-connected workstations; never click links or open attachments on a signing device.",
      "Endpoint-detection (EDR) and minimum-trust IDE/extension policies for all team members; treat repository clones from external counterparties as untrusted code.",
      "Run a 'devil's advocate' security ceremony for every multisig signing: at least one signer's job is to look for malicious encodings.",
      "Maintain a vetted intermediary verification process for any business development engagement that requires onboarding new vault assets or signing test transactions.",
    ],
  },
  "serum-ftx-averted-nov-2022": {
    lesson:
      "Centralized upgrade authority on critical infrastructure is a counterparty-risk landmine; the FTX collapse showed how quickly an authority key becomes adversarial.",
    mitigations: [
      "Always use multisig with independent signers for any program upgrade authority.",
      "Document and publish the upgrade authority configuration so the community can audit.",
      "Build community fork procedures and reproducible builds in advance, not under crisis.",
      "Where possible, freeze upgrade authority entirely after maturity (final, immutable programs).",
    ],
  },
  "jan-2022-congestion": {
    lesson:
      "Sustained congestion (without a clean outage) erodes user trust and DeFi safety because oracles, liquidations, and refunds may silently miss SLAs.",
    mitigations: [
      "Improve signature verification throughput in the validator client.",
      "Apply local fee markets and per-account write-lock pricing.",
      "Migrate ingress to QUIC with admission control.",
      "DApps should design for degraded throughput: oracle staleness checks, liquidation rate-limiting, retry budgets.",
    ],
  },
  "jan-2022-duplicate-tx": {
    lesson:
      "Naive transaction ingest accepts duplicates as a free DoS amplifier; deduplication and admission control are part of consensus reliability.",
    mitigations: [
      "Validator-side dedup of inbound transactions with bloom filters.",
      "QUIC-based ingress to enforce per-source flow control.",
      "Per-IP / per-stake admission caps for transaction submission.",
      "Encourage RPC providers to dedup at the edge before forwarding to validators.",
    ],
  },
  "mainnet-stall-dec-2020": {
    lesson:
      "Early-mainnet incidents helped define operational maturity expectations: snapshots, restart procedures, and validator-coordination playbooks are part of consensus, not afterthoughts.",
    mitigations: [
      "Maintain signed, reproducible snapshots and a documented restart protocol.",
      "Drill restart procedures regularly with the validator community.",
      "Improve early-stage observability and post-mortem publication discipline.",
      "Build client diversity (Agave, Firedancer, Jito-Solana) for resilience to single-implementation bugs.",
    ],
  },
  // Informational entries: deliberately no `lesson`/`mitigations` (they are aggregator/see-also notes).
  "solana-foundation-stride-sirn-apr-2026": {},
  "cetus-sui-exploit-may-2025-see-also": {},
};

const data = JSON.parse(readFileSync(DATA_PATH, "utf8"));

let added = 0;
let skipped = 0;
const missing = [];

for (const inc of data) {
  const e = ENRICH[inc.id];
  if (!e) {
    if (inc.severity !== "informational") missing.push(inc.id);
    continue;
  }
  if (e.lesson && (!inc.lesson || FORCE)) {
    inc.lesson = e.lesson;
    added++;
  }
  if (e.mitigations && (!inc.mitigations || FORCE)) {
    inc.mitigations = e.mitigations;
    added++;
  }
  if (!e.lesson && !e.mitigations) skipped++;
}

writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");

console.log(`enriched fields written: ${added}`);
console.log(`informational entries skipped: ${skipped}`);
if (missing.length) {
  console.log("missing enrichment for non-informational ids:");
  for (const id of missing) console.log("  -", id);
}
