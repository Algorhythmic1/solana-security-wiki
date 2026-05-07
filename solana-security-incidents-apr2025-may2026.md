# Solana Security Incidents: April 2025 – May 2026

A chronological catalog of security incidents in the Solana ecosystem covering the period requested. Each entry includes the date, target, loss estimate, attack vector, brief description, and primary sources.

A note on scope: I've included incidents where Solana is the affected chain, the affected protocol is Solana-native, or the incident centrally involves Solana infrastructure (e.g., the SwissBorg/Kiln SOL staking compromise). I've **excluded** Cetus Protocol (May 2025, $223M) since that's Sui/Aptos, not Solana — though it's frequently cited alongside Solana incidents as a comparative reference for the social-engineering pattern.

The aggregator pages worth bookmarking for ongoing wiki sourcing:
- **SlowMist Hacked database** (Solana filter): https://hacked.slowmist.io/?c=Solana — curated, chronological, with primary X/source links
- **Helius "Solana Hacks, Bugs, and Exploits"**: https://www.helius.dev/blog/solana-hacks — comprehensive but capped at Q1 2025; useful as the "canonical" pre-April 2025 reference your hackathon submissions overlap with

---

## 2025

### April 2025

#### Loopscale (April 26, 2025) — ~$5.8M — Oracle/collateral pricing exploit
A modular Solana-based DeFi lending market hit ~2 weeks after launch. The root cause was identified as an isolated issue with Loopscale's pricing of RateX-based collateral (oracle manipulation against a novel collateral type). Approximately 5,726,725 USDC and 1,211 SOL were drained, ~12% of TVL. Loopscale offered a 10% bug bounty + immunity; **all funds were returned by April 29, 2025**. Vault withdrawals re-enabled May 8.
- The Block: https://www.theblock.co/post/352083/solana-defi-protocol-loopscale-hit-with-5-8-million-exploit-two-weeks-after-launch
- Halborn explainer: https://www.halborn.com/blog/post/explained-the-loopscale-hack-april-2025
- Loopscale official: https://x.com/LoopscaleLabs/status/1916230435291713786
- SlowMist entry: https://hacked.slowmist.io/?c=Solana

### July 2025

#### Texture (July 9, 2025) — ~$2.2M — Smart contract vulnerability
Solana-based lending protocol Texture had ~$2.2M drained from one of its vaults via a contract vulnerability. Texture offered a 10% bounty; the attacker returned $1.98M and kept $220,000.
- Texture official: https://x.com/texture_fi/status/1942972150631002245
- SlowMist entry: https://hacked.slowmist.io/?c=Solana

#### Swarms (July 21, 2025) — N/A (account compromise)
The AI agent protocol Swarms had its community Discord compromised after a team member fell for a phishing DM. Channels deleted, ~300+ members removed. No direct financial loss reported.
- Swarms official: https://x.com/swarms_corp/status/1947156712227824027

#### @kodane/patch-manager npm package (uploaded July 28, 2025) — supply chain / wallet drainer
AI-generated malicious npm package containing a Solana wallet drainer. ~1,500 downloads before takedown. Notable as one of the first publicly documented cases of an LLM-assisted (Claude-generated, per researchers' findings) supply-chain wallet drainer targeting Solana keys.
- The Hacker News: https://thehackernews.com/2025/08/ai-generated-malicious-npm-package.html

### August 2025

#### Credix (August 4, 2025) — ~$4.5M — Suspected rug pull (disguised as exploit)
Decentralized lending protocol Credix announced an exploit in which an attacker gained control of an admin wallet, minted tokens, and drained liquidity pools. Credix claimed a "settlement" with the attacker conditional on partial payment from Credix treasury — then deleted social media accounts and the team disappeared. Widely treated as a rug pull. Reimbursements never delivered.
- Web3 Is Going Great: https://www.web3isgoinggreat.com/?id=credix-exploit
- SlowMist entry: https://hacked.slowmist.io/?c=Solana

### September 2025

#### SwissBorg / Kiln (September 8, 2025) — ~$41.5M — Supply chain / API compromise
The largest Solana-related theft of mid-2025. Swiss wealth management platform SwissBorg lost ~192,600 SOL (~$41M) from its SOL Earn Program. Root cause was a compromise of staking infrastructure provider **Kiln's** API — specifically, a stolen GitHub access token belonging to a Kiln infrastructure engineer that enabled malicious payload injection into the Kiln Connect API. The attacker buried 8 authorization instructions inside what appeared to be a routine "deactivate" (unstaking) transaction, transferring stake-account control from SwissBorg to attacker-controlled accounts.

This incident is widely compared to the Bybit hack as a "v2" social engineering / signing-infrastructure compromise. SwissBorg covered all user losses from treasury. Affected ~1% of users / 2% of platform AUM.
- Halborn explainer: https://www.halborn.com/blog/post/explained-the-swissborg-hack-september-2025
- SwissBorg official postmortem: https://swissborg.com/blog/swissborg-security-update-kiln-breach
- Kiln + SwissBorg joint statement: https://swissborg.com/blog/joint-statement-kiln-x-swissborg-regarding-sol-incident
- QuillAudits technical breakdown: https://www.quillaudits.com/blog/hack-analysis/swissborg-exploit
- Crowdfund Insider: https://www.crowdfundinsider.com/2025/09/250488-crypto-security-breach-swissborg-faces-41m-solana-theft/
- Unchained: https://unchainedcrypto.com/hackers-drain-41-million-from-swissborgs-solana-earn/

#### Aqua (September 8, 2025) — ~$4.65M — Rug pull
ZachXBT identified Solana project Aqua as having executed a rug pull involving ~21,770 SOL (~$4.65M). Funds were split into four parts, routed through intermediary addresses, and sent to instant exchanges. Notably, Aqua had been promoted by teams including Meteora, QuillAudits, Helius, SYMMIO, and Dialect.
- ZachXBT report (via Odaily): https://www.odaily.news/zh-CN/newsflash/447163
- SlowMist entry: https://hacked.slowmist.io/?c=Solana

### October 2025

#### Watt Protocol (October 9, 2025) — N/A (account compromise)
Watt Protocol's official X account compromised, used to post phishing tweets. Reported by Scam Sniffer.
- Scam Sniffer: https://x.com/realScamSniffer/status/1976284421448925574

#### DoodiPals (October 21, 2025) — ~$171,000 — Private key leakage
Solana-based mini entertainment project DoodiPals suffered a private key leak. Attacker sold tokens from dozens of wallets and exchanged for SOL, profiting ~917 SOL.
- evilcos report: https://x.com/evilcos/status/1980443998461608427

### November 2025

#### DMT Airdrop / dexmaxai (November 20, 2025) — ~$130,000+ — Phishing / rug pull
Users who claimed the DMT airdrop from @dexmaxai were tricked into granting token approvals during the claim process. 1,000+ users compromised, $130,000+ in assets stolen via cross-chain transfers. Stolen funds were bridged to Ethereum and largely deposited at HitBTC. The official site and Twitter went offline shortly after — likely a rug pull.
- GoPlus security alert: https://x.com/GoPlusZH/status/1991436599461319047

#### Upbit (November 27, 2025) — ~$36–38M — Exchange hot wallet / private key compromise
South Korea's largest crypto exchange suffered unauthorized withdrawals of ~₩54B (~$36–38M) from its **Solana hot wallet**, on the exact six-year anniversary of its 2019 Ethereum heist. Stolen tokens included USDC, BONK, JTO, SONIC, RAY, RENDER, ORCA, and PYTH. Upbit suspended Solana network deposits/withdrawals, moved remaining assets to cold storage, and committed to fully reimbursing users from operational reserves.
- CCN timeline: https://www.ccn.com/education/crypto/upbit-2025-hack-36-million-solana-assets-stolen/
- QuillAudits initial report: https://x.com/QuillAudits_AI (Nov 27, 2025 thread)

### Late 2025 — Ongoing pattern: Solana phishing via "Owner permission" abuse
Throughout late 2025 (notably reported by SlowMist in early December), a wave of phishing attacks targeted Solana users by exploiting Solana's "Owner" account field. Unlike Ethereum EOAs, Solana accounts have an Owner field specifying which program controls them — reassignable via on-chain instruction. Attackers crafted malicious transactions that appeared harmless in wallet simulations (no visible token transfer) but silently transferred account ownership. One reported case involved a $3M+ loss from a single victim.
- SlowMist analysis (via CyberPress): https://cyberpress.org/solana-phishing-attacks/

---

## 2026

### January 2026

#### Solar / @Solana_zh (January 27, 2026) — N/A (account compromise)
Official Solana Mandarin community X account compromised.
- SlowMist entry: https://hacked.slowmist.io/?c=Solana

#### Step Finance (January 31, 2026) — ~$27–40M — Supply chain / executive device compromise
Solana DeFi portfolio dashboard Step Finance had its treasury wallets drained: 261,854 SOL withdrawn after stake authorization was transferred to an attacker-controlled wallet. CertiK and other firms identified the cause as compromised devices belonging to executives (operational-security failure, not a smart-contract bug).

The STEP token collapsed ~96%. After exploring financing/acquisition options, Step Finance announced on **February 23, 2026** that it would wind down operations along with its sister projects **SolanaFloor** (Solana news outlet) and **Remora Markets** (tokenized stock marketplace). Recovered ~$3.7M in Remora assets and $1M in other positions.

Note: Loss estimates vary by source. SlowMist lists $40M; Decrypt and CoinInsider report $27–29M. The discrepancy appears to be SOL price at time of accounting.

- Step Finance official: https://x.com/StepFinance_/status/2018379876642804213
- Decrypt (wind-down announcement): https://decrypt.co/358970/solana-defi-project-step-finance-to-wind-down-weeks-after-29m-hack
- Coin Insider analysis: https://www.coininsider.com/news/2026/02/solana-shake-up-3-platforms-shut-after-27m-hack
- SlowMist entry: https://hacked.slowmist.io/?c=Solana

### February 2026

#### Stake Nova (February 27, 2026) — ~$137,014 — Business logic / flash loan exploit
Solana liquid-staking protocol Stake Nova lost ~$137K (~95% of user deposits) due to an unchecked validation issue in the `RedeemNovaSol()` function, exploited via flash loan to drain the liquidity pool. Vulnerability patched, dApp taken offline. Team offered a 10% on-chain bounty.
- Chris Dior report: https://x.com/chrisdior777/status/2027080169983295538

### March 2026

#### BONKfun (March 11, 2026) — ~$30,000 — Domain hijacking / DNS attack
BONKfun's official website was hijacked via a social engineering attack against its DNS provider; the domain was transferred to an external registrar. The attack was at the DNS layer — internal systems, codebases, and team accounts were not compromised. ~$30K in customer losses from users interacting with the malicious domain. Team committed to compensating affected users at 110%. Domain control restored ~March 18; main wallet provider functionality restored March 19.
- Solport Tom report: https://x.com/SolportTom/status/2031930573342519702

### April 2026

#### Drift Protocol (April 1, 2026) — ~$285M — Social engineering + durable nonce abuse
**The defining incident of the period.** Largest DeFi hack of 2026 and second-largest in Solana history (after Wormhole's $326M in 2022). A six-month North Korean state-affiliated operation (attributed with medium-high confidence to UNC4736 / AppleJeus / Citrine Sleet — same group behind Radiant Capital's $53M hack in October 2024).

**Attack mechanics**:
1. **Social engineering (Fall 2025 → April 2026)**: Third-party intermediaries (not DPRK nationals themselves) approached Drift contributors at major crypto conferences posing as a quantitative trading firm. Built rapport over 6 months across multiple countries.
2. **Operational integration (Dec 2025 – Jan 2026)**: Onboarded an Ecosystem Vault, deposited >$1M of their own capital, engaged in working sessions, asked detailed product questions.
3. **Initial compromise**: One Drift contributor cloned a code repository shared by the group (likely containing a known VSCode/Cursor vulnerability — relevant to your context given recent Cline/Cursor work). A second contributor was induced to download a fake TestFlight application.
4. **Durable nonce abuse**: Between March 23–30, 2026, attackers created multiple Solana durable nonce accounts and used social engineering to get Drift Security Council multisig signers to pre-sign transactions that appeared routine but contained hidden authorizations.
5. **Zero-timelock migration**: On March 27, Drift migrated its Security Council to a new 2/5 threshold with **zero timelock** — eliminating the detection window. Attacker adapted by re-obtaining 2-of-5 approval threshold on March 30.
6. **CarbonVote Token (CVT)**: Attacker manufactured a fake collateral token weeks earlier — minted 750M units, seeded a few thousand dollars of liquidity on Raydium, wash-traded to anchor a ~$1 price.
7. **Execution (April 1, 2026 ~16:05 UTC)**: After a legitimate Drift insurance fund test withdrawal, the attacker submitted pre-signed durable nonce transactions. Two transactions, four slots apart, gained protocol-level admin control. Whitelisted CVT as collateral with infinite borrowing limits, deposited 500M CVT, drained $285M in real assets across 18+ token types.
8. **Laundering**: Stolen assets swapped to USDC via Jupiter, bridged to Ethereum via Circle CCTP (>$230M USDC across 100+ transactions — ZachXBT publicly criticized Circle for not freezing during a 6-hour window), converted to ETH. Funds also moved through NEAR, Backpack, Wormhole, and Tornado Cash.

**Asset breakdown** (~$285M total): JLP ~$155–159M, USDC ~$60–71M, cbBTC ~$11.3M, USDT ~$5.6M, USDS ~$5.3M, WETH ~$4.7M, dSOL ~$4.5M, WBTC ~$4.4M, FARTCOIN ~$4.1M, JitoSOL ~$3.6M, plus smaller amounts across JUP, MNDE, and others.

**Drift TVL**: Collapsed from ~$550M to <$250M.

Primary sources:
- Drift official postmortem (April 5, 2026): https://x.com/DriftProtocol
- TRM Labs technical analysis: https://www.trmlabs.com/resources/blog/north-korean-hackers-attack-drift-protocol-in-285-million-heist
- Elliptic on DPRK attribution: https://www.elliptic.co/blog/drift-protocol-exploited-for-286-million-in-suspected-dprk-linked-attack
- Chainalysis lessons-from analysis: https://www.chainalysis.com/blog/lessons-from-the-drift-hack/
- The Hacker News (UNC4736 / AppleJeus attribution): https://thehackernews.com/2026/04/285-million-drift-hack-traced-to-six.html
- BitPinas timeline: https://bitpinas.com/cryptocurrency/drift-protocol-exploit/
- CoinDesk technical (durable nonce mechanics): https://www.coindesk.com/tech/2026/04/02/how-a-solana-feature-designed-for-convenience-let-an-attacker-drain-usd270-million-from-drift
- Bloomberg: https://www.bloomberg.com/news/articles/2026-04-01/solana-based-defi-project-drift-hit-by-285-million-exploit
- Pool Party Nodes (very detailed mechanic walkthrough): https://poolpartynodes.com/learn/crypto-news/solana-drift-protocol-exploit-2026/
- MEXC analysis: https://www.mexc.com/learn/article/drift-protocol-hacked-for-285m-the-second-largest-exploit-in-solana-history/1
- Drift initial X disclosure: https://www.coindesk.com/tech/2026/04/01/solana-defi-platform-drift-investigates-suspicious-activity-tells-users-to-halt-deposits

#### Solana Foundation response — Stride + SIRN (April 6–7, 2026)
Five days after Drift, the Solana Foundation announced two initiatives:
- **Stride**: Structured evaluation program led by Asymmetric Research; assesses Solana DeFi protocols against eight security pillars and publishes findings publicly. Founding members include Asymmetric Research, OtterSec, Neodyme, Squads, ZeroShadow.
- **Solana Incident Response Network (SIRN)**: Dedicated network of security firms with established relationships to bridges, exchanges, and stablecoin issuers, prioritized by TVL (>$10M). Includes free access to Hypernative threat detection, Range Security real-time monitoring, Neodyme Riverguard attack simulation, Sec3, AuditWare.

Foundation explicitly noted that neither would have prevented the Drift attack — formal verification doesn't catch durable-nonce social engineering, and 24/7 onchain monitoring doesn't help when transactions are valid by design.
- CoinDesk: https://www.coindesk.com/tech/2026/04/07/solana-foundation-unveils-security-overhaul-days-after-usd270-million-drift-exploit
- Cryptopolitan: https://www.cryptopolitan.com/solana-unveils-crisis-mode-defi-threats/

---

## Cross-period thematic notes for the wiki

**Patterns observable in this window (vs. the 2020–Q1 2025 hackathon corpus)**:
1. **Shift from contract bugs to operational/social-engineering compromises**. The largest losses in the period (Drift $285M, SwissBorg/Kiln $41M, Step Finance $27–40M, Upbit $36M) all involved compromised humans, devices, or third-party infrastructure rather than smart-contract vulnerabilities. Loopscale and Texture (the two notable smart-contract exploits) were in the single-digit-millions.
2. **Solana-specific feature abuse becomes a category**. The Drift attack is the first major exploitation of durable nonces — a legitimate Solana feature — for a multisig pre-signing attack. Late-2025 phishing waves abusing Solana's "Owner" permission field also represent a Solana-specific vector that doesn't translate cleanly to EVM-chain wiki frameworks.
3. **DPRK / UNC4736 attribution continues to dominate large-loss incidents.** Per Chainalysis, North Korea was responsible for ~$2.02B in crypto theft in 2025 — the Drift hack continues this trend in 2026.
4. **Supply-chain attacks on staking infrastructure (Kiln) and dev tooling (npm packages, VSCode/Cursor extensions) are now an established vector**. Worth a category alongside the application/network/protocol categories that the Helius taxonomy uses.

**A non-Solana incident worth referencing for completeness**: **Cetus Protocol (Sui/Aptos), May 22, 2025, ~$223M** — frequently cited in the same breath as Solana incidents because (a) the Cetus team is also behind Crema Finance (the Solana AMM hacked in 2022), (b) it's the same arithmetic-overflow-class vulnerability pattern that affects concentrated liquidity protocols across chains, and (c) the social-engineering comparison is invoked in nearly every Drift writeup. Worth a "see also" entry in your wiki, not a primary entry. Sources: https://www.theblock.co/post/357386/sui-dex-cetus-protocol-restarts-platform-after-recovering-from-223-million-exploit and https://x.com/threesigmaxyz/status/1926971295708627337
