# Fitto — Gentle Fitness for Beginners

A Duolingo-like beginner fitness app prototype focused on **consistency over intensity**. Fitto uses a local rule-based adaptive engine to personalize micro-session recommendations based on your current energy level and recent behavior.

**Core hypothesis:** If the system lowers the barrier based on energy + recent skips, beginners are more likely to "show up again."

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 5-Minute Demo Script

This script walks through the full adaptive loop in under 5 minutes.

### Step 1: Fresh Start (~30s)
1. Open the app. You see the **Fitto** header and energy check-in.
2. No recommendation shows yet — the app waits for your energy input.

### Step 2: Energy → Recommendation (~1 min)
1. Tap **Medium**. A gentle 5–6 min stretch/mobility session appears.
2. Expand **"Why this today?"** — shows energy=medium, 0 skips, 0 completions, and the rule triggered.
3. Now tap **Low**. Watch the recommendation instantly change to a 2–3 min breathing/posture reset. The "Why this today?" panel updates in real-time.
4. Tap **High**. Notice the recommendation still stays gentle (no consistency yet).

### Step 3: Complete a Session (~1 min)
1. Tap **"Begin when you're ready"** on any suggestion.
2. The session screen shows a calm timer. Wait a few seconds.
3. Tap **Done**. See the gentle affirmation: "You showed up today — that's what matters most."
4. Return to Home. The **Your Journey** section now shows a filled square for today.

### Step 4: Demo Mode — Show Adaptation (~2 min)
1. Tap the **Demo** button (top-right, discreet).
2. Tap **"+ 2 Skips"**. The recommendation drops to a 2–3 min reset session. Expand "Why this today?" to see "2 skips this week → lowering the ask."
3. Tap **Reset** to clear state.
4. Tap **"High Consistency"**. This simulates 3 completions + high energy. The recommendation jumps to an 8–10 min flow session. "Why this today?" shows the consistency rule.
5. Tap **"Low Energy"**. Even with high consistency, low energy overrides → 2–3 min reset. This demonstrates the barrier-lowering principle.

### Step 5: Skip Flow (~30s)
1. Start a session, then tap **Skip**. See the compassionate message: "Rest is part of the journey."
2. Return to Home — the skip is logged and visible in the journey.

**Key takeaway for graders:** The recommendation adapts instantly based on two inputs (energy + behavior). The system always lowers the barrier when someone is struggling, embodying the "consistency over intensity" philosophy.

## Tech Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Local rule-based adaptive engine** (simulates AI — no external API calls)
- **localStorage** for state persistence
- Animated gradient blobs via CSS keyframes (respects `prefers-reduced-motion`)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx            # Root layout, metadata
│   ├── page.tsx              # Home: energy check-in, suggestion card, journey
│   ├── globals.css           # Tailwind + reduced-motion styles
│   └── session/[id]/page.tsx # Session: timer, done/skip flow
├── lib/
│   ├── engine/
│   │   ├── catalog.ts        # 11 micro-sessions across 6 categories
│   │   └── recommendation.ts # Rule-based adaptive engine
│   └── storage.ts            # localStorage persistence + utility functions
```

## Adaptive Engine Rules

| Condition | Recommendation | Rationale |
|-----------|---------------|-----------|
| Energy = Low **OR** skips ≥ 2 | 2–3 min reset (breathing / posture) | Lowering the barrier to help restart gently |
| Energy = Medium, skips < 2 | 5–6 min gentle stretch / mobility | Steady support to maintain rhythm |
| Energy = High, completions ≥ 2 | 8–10 min flow session | Build momentum without intensity spikes |
| Default | Gentle session | Safe fallback |

## Scope Decisions

### Included
- **Energy-first UX flow** — energy check-in drives the recommendation, not the other way around
- **Instant adaptation** — changing energy or using demo controls updates the suggestion in real-time
- **"Why this today?" transparency panel** — shows exact inputs (energy, skips, completions) and the rule that fired
- **7-day journey visualization** — simple squares showing activity rhythm without gamification pressure
- **Demo Mode** — simulate different states for live demos (low energy, skips, high consistency, reset)
- **Compassionate UX copy** — skip messages, affirmations, and language that avoids achievement pressure
- **Animated gradient blobs** — subtle background animation in the suggestion card, motion-safe
- **Session catalog** — 11 micro-sessions (2–10 min) across breathing, stretch, mobility, walk, posture, core

### Cut (and why)
- **User accounts / auth** — prototype scope; localStorage is sufficient for demo
- **Backend / database** — no server needed; rule engine runs client-side
- **Real AI / ML model** — rule-based engine is transparent and predictable for demo; real ML would require training data we don't have
- **Onboarding flow** — cut for time; the app is self-explanatory for a 5-min demo
- **Notifications / reminders** — out of scope for prototype; would need native capabilities
- **Workout content / media** — sessions are described, not animated or video-guided
- **Social features** — not relevant to the core hypothesis being tested
- **Dark mode** — nice-to-have but not critical for demo
- **Progress statistics / charts** — the 7-day rhythm view is sufficient; deeper analytics would add complexity without testing the hypothesis
- **Multiple recommendations / browsing catalog** — intentionally shows ONE suggestion to reduce decision fatigue (core to the Duolingo-like approach)

### Limitations
- State is browser-local only (clearing browser data resets everything)
- The "random" selection within a tone category means the exact session may vary on re-renders
- Timer is cosmetic — it counts up but doesn't enforce the suggested duration
- No accessibility audit was performed (though color contrast meets WCAG AA for the chosen palette)
