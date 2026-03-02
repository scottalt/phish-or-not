# replyTo Field — Design Doc

**Date:** 2026-03-02
**Status:** Approved

## Problem

The headers panel currently shows `card.from` as the Reply-To value for all cards. For hard phishing cards this is wrong — it hides the key forensic signal that a mismatched Reply-To address provides. Verified/PASS hard cards have no headers-based tell at all without it. Unverified/NONE cards lose a high-confidence signal.

## Solution

Add an optional `replyTo?: string` field to the `Card` interface. Populate it on all 5 hard phishing cards in `data/cards.ts`. The headers panel uses `card.replyTo ?? card.from` — cards without it fall back silently to the current behaviour.

## Approach

**Optional field on Card** — the data belongs on the card. Typed, optional, forward-compatible with future Supabase `cards_real` ingestion.

Rejected alternatives:
- Separate ID→address map: fragile hidden coupling, doesn't extend to Supabase
- Algorithmic derivation: deterministic but narratively meaningless

## Reply-To Addresses (existing hard phishing cards)

Calibrated by attack pattern:

| Card | FROM | authStatus | replyTo | Rationale |
|---|---|---|---|---|
| p-hard-001 | `ceo@acmecorp-global.com` | verified | `j.hartwell.ceo@gmail.com` | BEC — attacker controls sending domain but reads replies in personal Gmail |
| p-hard-002 | `events@linkedin-notifications.net` | unverified | `linkedinsupport.help@outlook.com` | Free provider inbox behind a LinkedIn-lookalike from address |
| p-hard-003 | `noreply@github.com` | unverified | `github-security@protonmail.com` | Spoofed GitHub, replies redirected to Protonmail |
| p-hard-004 | `invoices@delta-tech-supplies.com` | verified | `d.chen88@hotmail.com` | Vendor fraud — PASS headers, but payment confirmations go to Hotmail |
| p-hard-005 | `it-helpdesk@yourdomain-support.com` | unverified | `ithelpdesk.admin@gmail.com` | IT helpdesk spoofing, Gmail redirect |

## Files Changed

- `lib/types.ts` — add `replyTo?: string` to `Card` interface
- `data/cards.ts` — add `replyTo` to 5 hard phishing cards
- `components/GameCard.tsx` — use `card.replyTo ?? card.from` in the headers IIFE for all three authStatus branches; `returnPath` stays as `card.from`

## Out of Scope

- Supabase `cards_real` table: add `reply_to TEXT` column when Supabase card ingestion is built
- Generation prompt: add `replyTo` guidance when the prompt is next updated for hard/extreme cards
