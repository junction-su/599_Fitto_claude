import { catalog, Session } from "./catalog";

export type EnergyLevel = "low" | "medium" | "high";

export interface Recommendation {
  session: Session;
  rationale: string;
  rule: string;
}

export interface RecommendationInput {
  energy: EnergyLevel;
  skipsLast7Days: number;
  completionsLast7Days: number;
  lastRecommendationId?: string;
}

// ─── Single recommendation (kept for compatibility) ──────────────────────────

export function getRecommendation(input: RecommendationInput): Recommendation {
  return getRecommendations(input)[0];
}

// ─── 3-card recommendation set ───────────────────────────────────────────────

export function getRecommendations(input: RecommendationInput): Recommendation[] {
  const { energy, skipsLast7Days, completionsLast7Days, lastRecommendationId } = input;

  const hasSkips = skipsLast7Days >= 2;
  const hasStreak = completionsLast7Days >= 2;

  // ── Step 1: Energy level unconditionally determines the session pool ──────
  //   Low    → reset sessions   (2–3 min: Breathing, Posture, Body Scan)
  //   Medium → gentle sessions  (5–6 min: Stretch, Mobility, Walk)
  //   High   → energizing sessions (8–10 min: Flow, Core, Walk, Full-Body)
  //
  //   This guarantees that changing energy always changes the visible cards.
  const primaryTone: Session["tone"] =
    energy === "low" ? "reset" : energy === "high" ? "energizing" : "gentle";

  let pool = catalog.filter((s) => s.tone === primaryTone);

  // ── Step 2: Behavior signals reorder within the pool ─────────────────────
  //   Skips ≥ 2  → shortest / lowest-friction sessions first
  //   Streak ≥ 2 → longer / more substantial sessions first
  //   Neutral    → natural catalog order (already ASC by duration)
  if (hasSkips) {
    pool = [...pool].sort((a, b) => a.durationMin - b.durationMin);
  } else if (hasStreak) {
    pool = [...pool].sort((a, b) => b.durationMin - a.durationMin);
  }

  // ── Step 3: Push last recommendation to end (avoid repeating same card) ──
  const excluded = pool.find((s) => s.id === lastRecommendationId);
  const ordered = excluded
    ? [...pool.filter((s) => s.id !== lastRecommendationId), excluded]
    : pool;

  // ── Step 4: Pick first 3 unique sessions ─────────────────────────────────
  const picked: Session[] = [];
  for (const s of ordered) {
    if (picked.length >= 3) break;
    if (!picked.find((p) => p.id === s.id)) picked.push(s);
  }

  // ── Step 5: Attach explainable rule + rationale ───────────────────────────
  const { rule, rationale } = buildContext(energy, skipsLast7Days, completionsLast7Days);

  return picked.map((session, i) => ({
    session,
    rationale:
      i === 0
        ? rationale
        : `Another ${energy === "low" ? "calming" : energy === "medium" ? "gentle" : "active"} option — ${session.durationMin} min ${session.tag.toLowerCase()} if this feels like a better fit.`,
    rule:
      i === 0
        ? rule
        : `Alternative ${energy} energy option — ${session.durationMin} min ${session.tag}.`,
  }));
}

// ─── Explainability helpers ───────────────────────────────────────────────────

function buildContext(
  energy: EnergyLevel,
  skips: number,
  completions: number
): { rule: string; rationale: string } {
  const hasSkips = skips >= 2;
  const hasStreak = completions >= 2;

  if (energy === "low") {
    return {
      rule: hasSkips
        ? `Low energy + ${skips} skips this week → reset sessions to keep the habit alive with zero friction.`
        : `Low energy → short reset sessions (2–3 min) to lower the barrier to showing up.`,
      rationale: hasSkips
        ? "Low energy and recent skips — the shortest possible session to keep the habit alive."
        : "Keeping it as simple as possible so showing up still counts.",
    };
  }

  if (energy === "medium") {
    return {
      rule: hasSkips
        ? `Medium energy + ${skips} skips → gentlest options first to rebuild momentum.`
        : hasStreak
        ? `Medium energy + ${completions} completions this week → steady movement to keep your streak going.`
        : `Medium energy → gentle movement sessions (5–6 min) to maintain rhythm.`,
      rationale: hasSkips
        ? "A few recent skips — starting with something low-friction to get back on track."
        : hasStreak
        ? "You've been consistent — a steady gentle session to maintain that rhythm."
        : "Steady movement to support a healthy routine.",
    };
  }

  // High energy
  return {
    rule: hasSkips
      ? `High energy but ${skips} skips → prioritizing shorter active sessions to ease back in.`
      : hasStreak
      ? `High energy + ${completions} completions this week → longer sessions to build on your momentum.`
      : `High energy → active beginner-friendly sessions (8–10 min) to match your energy.`,
    rationale: hasSkips
      ? "High energy but some recent skips — easing back in with a shorter active session."
      : hasStreak
      ? "Strong consistency and high energy — time to build on that momentum."
      : "You're feeling good — a more active session to match your energy.",
  };
}
