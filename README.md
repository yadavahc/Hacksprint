# GALLA

### Aapka udhaar, wapas aapke galla mein.

**An agentic AI back-office that turns a kirana merchant's informal udhaar book into recovered cash and lender-ready credit history.**

Built by **Team Spy** for **HackSprint** (24-hour hackathon, MAHE) · **Track 1 — FinTech & Smart Commerce (PS21)**.

> **Prototype.** The merchant, customers and transactions are simulated demo data. GALLA never lends, holds or moves real money. UPI payments run on a payment gateway's **staging** environment with test money only.

---

## The problem

- **~13 million kiranas** form the backbone of India's retail and FMCG distribution.
- **Udhaar lives in notebooks.** Asking neighbours for money is awkward, so dues get delayed or forgotten.
- **Credit-invisible.** Good repayment behaviour leaves no record, so the merchant never gets formal working capital.

## How GALLA solves it

| Step | Feature | What happens |
| --- | --- | --- |
| 1 · **Capture** | **Voice Khata** | The merchant says *"Ramesh 450 udhaar, Friday tak"*. GALLA logs it and sends the customer a digital receipt. |
| 2 · **Recover** | **AI Recovery Calls** | Polite, consent-based calls in Kannada, Hindi or English. The agent negotiates a part-payment, then sends a UPI pay-link on WhatsApp. |
| 3 · **Grow** | **Credit Readiness Passport** | Clean repayment and UPI inflows become an explainable READY / ALMOST READY / NEEDS IMPROVEMENT score a lender can trust. |

**Measurable value:** ₹ udhaar recovered · days-to-recover ↓ · working capital freed · credit readiness ↑

---

## Features

### Udhaar Khata (`/app#/udhaar`, or Business → Udhaar Khata)
- **Voice Khata.** Log udhaar or repayments by voice (Sarvam STT) or text in English, Hindi or Kannada phrasing: *"Deepa 300 udhaar kal tak"*, *"Lakshmi ne 500 diya"*. A deterministic parser picks out the name, amount and due day, so it also works offline.
- **AI Recovery Calls.** A scripted live call in Kannada, Hindi or English. The customer offers a part-payment, the agent accepts and sends a UPI link. Repayments are recorded as payments and appear on Home, the QR tab and in the action history.
- **Customer Trust Score.** A GREEN / AMBER / RED tag, a safe credit limit and a next action for every udhaar customer.
- **Guardrails.** Calls only between 9 am and 8 pm, at most 2 reminders a week, opt-in required, opt-out honoured, every call logged.
- **Win-back Offers.** Customers who clear their dues can get a ₹20 loyalty offer.
- **Daily Galla Report.** An evening voice note covering recovered, outstanding, passport score and who to follow up with.
- **Fake Payment Shield** *(beta)*. Checks a customer's "paid" screenshot claim against real recorded UPI credits.
- **Bazaar Pulse** *(beta)*. An anonymous benchmark: *"Shops like yours recover 70% in 7 days. You: X%."*

### GALLA AI teammate (existing capabilities)
- **Command center.** Ask anything by voice or text in Kannada, Kanglish, Hindi, Hinglish or English. Answers come with evidence, confidence and uncertainty.
- **Growth.** Finds why sales dropped, simulates win-back campaigns, and runs them only after the merchant approves.
- **Inventory.** Predicts stock-outs and prepares supplier orders.
- **Cashflow guardian.** Shows available vs committed money and predicts UPI mandate failures.
- **Safety.** A QR and beneficiary risk check with nine explainable signals.
- **Credit Readiness Passport.** A score with reasons and concrete improvements. Lenders decide; GALLA never approves loans.
- **Documents and catalog.** Invoice extraction to stock updates, and a voice-to-digital catalog.
- **UPI test payments.** Collect a real staging payment from the QR tab, verified server-side.
- **Learning loop.** Every action is audited, and campaign results feed back into future estimates.

---

## Architecture

```mermaid
flowchart TD
  M["Merchant: voice or text"] -->|audio| STT["Sarvam STT<br/>/api/voice/stt"]
  M -->|text| API
  STT --> API["/api/galla"]
  STT --> KH["Voice Khata parser"]
  KH --> LEDGER["Khata ledger<br/>dues · trust score · guardrails"]
  LEDGER --> CALL["AI recovery agent<br/>consent · calling hours · 2/week cap"]
  CALL -->|UPI pay-link| PAY["UPI gateway (staging)<br/>/api/payments/initiate → /status"]
  PAY -->|verified repayment| LEDGER
  LEDGER --> CREDIT["Credit engine<br/>trust score · passport"]
  API --> ORC["GALLA orchestrator"]
  ORC --> AG["Agents: Growth · Inventory · Cashflow · Safety · Credit · Digitalization"]
  AG --> CALC["Deterministic data + calculations"]
  CALC --> LLM["LLM phrasing (Groq → Gemini → Claude)<br/>number-grounding guard"]
  LLM --> UI["GALLA UI"]
  UI -->|APPROVE| ENG["Action engine"] --> AUD["Audit log + learning loop"]
```

**Principles**
- **AI vs deterministic, clearly separated.** The LLM handles intent, language and explanation. Money, scores, dates and every state change are plain TypeScript.
- **Grounded answers.** `src/lib/ai/guard.ts` rejects any LLM reply that contains a number not present in the agent's facts.
- **Approval before action.** Agents only propose. The action engine executes after the merchant approves and records an audit entry.
- **Never breaks in a demo.** Without API keys, everything falls back to deterministic answers, simulated voice and simulated payments.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling & motion | Tailwind CSS v4, Framer Motion, Lucide icons |
| Charts | Recharts |
| Language models | Groq (primary), Google Gemini (fallback + vision), Anthropic Claude (optional) |
| Speech | Sarvam AI (STT + TTS) |
| Payments | Paytm Payment Gateway **staging** (UPI test money), official `paytmchecksum` |
| Validation | Zod |

---

## Getting started

Requires **Node.js 20+**. All API keys are optional; the app works fully in demo mode.

```bash
git clone https://github.com/yadavahc/Hacksprint.git
cd Hacksprint
npm install
cp .env.example .env.local   # fill in any keys you have (all optional)
npm run dev                  # http://localhost:3000
```

Production build: `npm run build && npm start`.

### Routes

| Route | What it is |
| --- | --- |
| `/` | Landing page |
| `/app` | Live application (Phone ↔ Normal presentation modes) |
| `/app#/udhaar` | Udhaar Khata: voice khata, AI recovery calls, trust scores |
| `/app#/galla`, `/app#/qr`, … | Deep link to any screen |
| `/demo` | Live application that auto-plays the 90-second story |

### Environment variables

Keys are only read in server route handlers. `GET /api/health` reports which capabilities are active.

| Variable | Enables |
| --- | --- |
| `GROQ_API_KEY`, `GROQ_MODEL` | Primary language model |
| `GEMINI_API_KEY`, `GEMINI_TEXT_MODEL`, `GEMINI_VISION_MODEL` | Text fallback and document reading |
| `ANTHROPIC_API_KEY` | Optional further fallback |
| `SARVAM_API_KEY` | Live Indian-language speech-to-text and spoken replies |
| `PAYTM_MID`, `PAYTM_MERCHANT_KEY`, `PAYTM_ENV=staging` | Real UPI test payments (production is deliberately refused) |

---

## Demo script for judges

1. Open **`/app`** → **Business → Udhaar Khata**.
2. Tap the sample *"Ramesh 450 udhaar, Friday tak"* → **Log**. The entry appears and a receipt is sent.
3. On **Lakshmi P** (AMBER, 4 days overdue) tap **AI call** → **Start call** in Kannada. See the part-payment outcome and the UPI link, then tap **₹… received via UPI**. Recovered rises and the payment shows on Home and the QR tab.
4. Try **Fake Payment Shield** with a wrong amount; it refuses to confirm.
5. Tap **Play 30-second voice note** on the Daily Galla Report.
6. Open **Credit Readiness** for the passport, then the **GALLA** tab and ask *"Nanna sales ee vaara yaake kadime aagide?"* for the AI teammate flow.
7. Or open **`/demo`** to let the full story play itself.

## API reference

| Method & route | Body | Returns |
| --- | --- | --- |
| `GET /api/health` | — | Active capabilities |
| `POST /api/galla` | `{ text, preferredLanguage, forceDemo, context }` | Structured agent response |
| `POST /api/voice/stt` | `multipart/form-data` `file` | `{ transcript, languageCode }` |
| `POST /api/voice/tts` | `{ text, language }` | `{ audio, mime }` |
| `POST /api/documents/extract` | `multipart/form-data` `file` | `{ extracted, engine }` |
| `POST /api/payments/initiate` | `{ amount, note? }` | `{ orderId, txnToken, amount, mid, scriptUrl }` |
| `POST /api/payments/status` | `{ orderId }` | `{ status, code, message, txnId?, paymentMode? }` |

A payment only counts when the gateway's own Transaction Status API returns `TXN_SUCCESS`. The browser's result alone is never trusted.

## Project structure

```
src/
  app/                  Landing, /app, /demo, API routes (galla · health · voice · documents · payments)
  components/
    udhaar/             Udhaar Khata: voice khata, recovery calls, trust, shield, daily report
    landing/            Landing page sections
    app-shell/          GallaApplication, screen registry, stage
    galla/ chat/ voice/ AI command center, cards, voice overlay
    home/ business/ customers/ inventory/ cashflow/ campaigns/ insights/
    safety/ credit/ documents/ catalog/ history/ settings/ payments/ demo/
    brand-header/ bottom-nav/ ui/
  lib/
    udhaar/             Khata ledger, voice-note parser, trust score, guardrails, call scripts
    agents/ ai/ data/ simulation/ risk/ cashflow/ inventory/ credit/ payments/ voice/ store/
```

## Trust, safety & compliance

- Customers opt in before any AI call and can opt out anytime.
- Calls only in allowed hours, capped per week, with no threats.
- GALLA never lends or holds money. UPI goes directly from customer to merchant.
- Data minimisation and consent logs, aligned with the DPDP Act.
- Credit readiness is guidance only. Lenders make every lending decision.

## Business model & roadmap

- **Freemium:** voice khata and reminders are free. **GALLA Pro ₹199/month:** AI calls, passport and Bazaar Pulse.
- **Lender referral fee:** only on consented, approved loans.
- **Roadmap:** 24h MVP → SMS / missed-call fallback → supplier pay-later → ONDC + Account Aggregator.
- **Pilot targets:** 30% faster udhaar recovery · 2 hrs saved per merchant per week · 50% reach a "ready" passport in 90 days.

---

*GALLA is a HackSprint prototype. All data is simulated; payments use test money only.*
