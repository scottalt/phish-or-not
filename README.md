# Threat Terminal

A cybersecurity research game measuring how humans detect AI-generated phishing emails. Built as a retro terminal experience.

**Live:** [research.scottaltiparmak.com](https://research.scottaltiparmak.com)

<p align="center">
  <img src="docs/menu.jpg" alt="Terminal boot screen" width="280" />
  <img src="docs/example.jpg" alt="Email analysis gameplay" width="280" />
  <img src="docs/roundsummary.jpg" alt="Round summary with score" width="280" />
</p>

---

## The Problem

AI can now generate phishing emails with perfect grammar, flawless spelling, and convincing context. The old signals (broken English, awkward phrasing, obvious typos) no longer apply. So how do humans detect phishing in 2026?

## What This Is

Threat Terminal is a game and live research platform. Players read AI-generated emails in a retro terminal interface, decide if each one is phishing or legitimate, and bet their confidence. Every answer contributes to a live dataset measuring which phishing techniques humans miss most when linguistic quality is no longer a reliable signal.

No security background needed. If you use email, you're a valid research participant.

---

## Game Modes

| Mode | Description | Access |
|------|-------------|--------|
| **Research Mode** | 10 cards per round from the research dataset. Each player contributes exactly 30 answers to the study, then graduates to unlock the other modes. | Requires sign-in |
| **Freeplay** | 10 random cards per round. Unlimited replays. | Unlocked after research graduation |
| **Daily Challenge** | Same 10 cards for all players each day. Resets at UTC midnight. One attempt per day. | Unlocked after research graduation |
| **Expert Mode** | Extreme difficulty only. Double XP. | Unlocked after research graduation |
| **H2H Ranked** | Head-to-head PvP. 5 cards per match, same deck for both players. Ranked rating system with 7 tiers (Bronze → Elite). Bot opponents as fallback. | Unlocked after research graduation |
| **DEADLOCK** | Roguelike survival mode. 5 floors of escalating difficulty with permadeath, floor gimmicks, card modifiers, a perk shop, and permanent upgrades. | Unlocked after research graduation |

**Core loop:**
- Read an email and classify it as phishing or legitimate
- Bet confidence: GUESSING (1x) · LIKELY (2x) · CERTAIN (3x)
- Earn XP from correct answers and streak bonuses
- Forensic signal breakdown after each answer shows what you missed

**Forensic signals available during gameplay:**
- Sender domain inspection (tap to reveal full email address)
- SPF / DKIM / DMARC authentication headers
- Reply-To mismatch detection
- Send timestamp analysis
- URL destination inspector (tap any link)
- Attachment filename analysis

---

## DEADLOCK (Roguelike Mode)

A roguelike survival run through 5 floors of escalating difficulty (Easy → Extreme). 5 cards per floor, 3 lives, permadeath.

**Floor gimmicks** add modifiers to each floor:
- *Tier 1:* FIRST_LOOK, TRIAGE, QUICK_SCAN
- *Tier 2:* UNDER_PRESSURE, INVESTIGATION, DECEPTION, BLACKOUT, CHAIN_MAIL, DOUBLE_AGENT, CONFIDENCE
- *Tier 3 (Boss):* BREACH, SUPPLY_CHAIN, INSIDER_THREAT, APT

**Card modifiers** make individual cards harder: LOOKALIKE_DOMAIN, DECOY_RED_FLAGS, AI_ENHANCED, TIMED, REDACTED_SENDER

**Intel economy:** Earn Intel points from correct answers, streaks, and floor clears. Spend Intel at the perk shop between floors on items like EXTRA_LIFE, SHIELD, DOUBLE_INTEL, SLOW_TIME, STREAK_SAVER, and INTEL_CACHE. Perk synergies unlock combo effects.

**Permanent upgrades:** Earn Clearance across runs to unlock 12 permanent upgrades across 3 branches:
- *Survival:* THICK_SKIN, FIELD_MEDIC, SECOND_WIND, LAST_STAND
- *Intelligence:* ANALYST_EYE, DEEP_NETWORK, SIGNAL_INTERCEPT, OMNISCIENCE
- *Profit:* HAZARD_PAY, BLACK_MARKET, HIGH_ROLLER, INSIDER_TRADING

**Handler companion:** SIGINT, an AI handler, provides contextual dialogue throughout runs — reacting to streaks, close calls, floor clears, and defeats.

---

## H2H Ranked

Competitive head-to-head matches against other players or bot opponents.

- 5 cards per match, identical deck for both players
- 7-tier rating system: BRONZE · SILVER · GOLD · PLATINUM · DIAMOND · MASTER · ELITE
- Real-time matchmaking with 30-second queue timeout, bot fallback
- Daily diminishing returns: full points for the first 10 rated matches, half rate after that, capped at 20/day
- Seasonal leaderboard (currently Season 0)

---

## Achievements

30+ achievement badges across 9 categories with 7 rarity tiers (Common → Unique):

| Category | Examples |
|----------|----------|
| Progression | FIRST_BLOOD, VETERAN_ANALYST, RESEARCH_GRADUATE, APEX_OPERATOR |
| Skill | ZERO_MISS, DEAD_CERTAIN, HARD_TARGET, EXPERT_ACE |
| Streak | HOT_STREAK, UNTOUCHABLE, DAILY_OPERATOR |
| Speed | SPEED_DEMON, METHODICAL |
| Investigation | HEADER_HUNTER, URL_INSPECTOR, FULL_RECON |
| XP | KILOBYTE, ENCRYPTED, CLASSIFIED, HIGH_SCORE |
| H2H | FIRST_KILL, SERIAL_WINNER, APEX_PREDATOR, FLAWLESS_VICTORY |
| DEADLOCK | FIRST_BREACH, TOWER_CLEAR, FLAWLESS_OP, GLASS_CANNON, SURVIVOR |
| Season 0 | FOUNDER, S0_SILVER, S0_GOLD, S0_DIAMOND, S0_ELITE |

Achievements are browsable in the Inventory page with rarity filtering and stat tracking.

---

## Research

**Study question:** Which phishing techniques are humans most likely to miss when linguistic quality is no longer a reliable detection signal?

**Dataset:** 1,000+ AI-generated email cards. Phishing cards span 6 techniques, legitimate cards cover transactional, marketing, and workplace categories. All cards are AI-generated so linguistic quality is held constant. Technique is the independent variable.

**Six phishing techniques under study:**

`urgency` · `authority-impersonation` · `credential-harvest` · `hyper-personalization` · `pretexting` · `fluent-prose`

**Data collection:** Research Mode requires a player account. Answers are linked to a pseudonymous player UUID. Email addresses are held only in Supabase Auth and are never stored in research tables. No behavioural tracking outside the game session.

**Recorded per answer:** classification, confidence level, response time, whether headers were opened, whether URLs were inspected, position within the session, card difficulty, and technique.

**Not recorded:** email address, IP address, location, or any identifying information.

Players optionally self-report their professional background: `NON-TECHNICAL`, `TECHNICAL / NON-SECURITY`, or `INFOSEC / CYBERSECURITY`. This enables comparison of bypass rates across expertise levels.

**Intel Briefing:** After research graduation, players unlock the Intel Briefing — a live dashboard showing aggregate findings from all participants including overall bypass rates, accuracy by background, and technique effectiveness.

- Methodology: [research.scottaltiparmak.com/methodology](https://research.scottaltiparmak.com/methodology)

---

## Progression

- **30 levels** with compounding XP requirements
- **10 ranks:** CLICK_HAPPY · PHISH_BAIT · LINK_CHECKER · HEADER_READER · SOC_ANALYST · THREAT_HUNTER · INCIDENT_HANDLER · RED_TEAMER · APT_ANALYST · ZERO_DAY
- **Leaderboards:** XP (global), Daily Challenge (score-based, resets daily), H2H Ranked (seasonal), DEADLOCK (score + clearance)
- **Seasonal progression:** Season 0 with exclusive badges and achievements

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Auth | Supabase Auth (email OTP, no passwords) |
| Database | Supabase (PostgreSQL) |
| Cache / Rate Limiting | Upstash Redis |
| Hosting | Vercel |
| Email | Resend (SMTP via scottaltiparmak.com) |
| Card Generation | Claude (Anthropic API) |
| Audio | Tone.js (synthesized SFX) |
| Analytics | Vercel Analytics |
| Testing | Playwright (E2E) |
| PWA | Service worker with auto-update, installable on mobile |

---

## Card Pools

| Pool | Cards | Difficulties | Used By |
|------|-------|-------------|---------|
| Daily / Freeplay | 450+ | Easy, Medium, Hard | Daily Challenge, Freeplay |
| Expert | 180+ | Extreme | Expert Mode |
| Research | 1,000+ | Easy → Extreme | Research Mode (frozen dataset) |

Each pool is independent. Research cards are never reused in other game modes. DEADLOCK and H2H draw from the Daily/Freeplay and Expert pools.

---

## Sound

- Ambient cyberpunk background music (loopable, low volume)
- Synthesized terminal click and keypress sound effects (Tone.js)
- All sound off by default, toggled via SFX button

---

## License

MIT
