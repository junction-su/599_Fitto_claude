import { catalog, Session } from "./catalog";

export type EnergyLevel = "low" | "medium" | "high";

export interface Recommendation {
  session: Session;
  rationale: string;
  rule: string;
}

interface RecommendationInput {
  energy: EnergyLevel;
  skipsLast7Days: number;
  completionsLast7Days: number;
  lastRecommendationId?: string;
}

function pickRandom<T>(items: T[], excludeIndex?: number): T {
  const filtered =
    excludeIndex !== undefined
      ? items.filter((_, i) => i !== excludeIndex)
      : items;
  return filtered[Math.floor(Math.random() * filtered.length)] || items[0];
}

function findByTone(
  tone: Session["tone"],
  excludeId?: string
): Session {
  const matches = catalog.filter(
    (s) => s.tone === tone && s.id !== excludeId
  );
  return matches.length > 0 ? pickRandom(matches) : catalog[0];
}

export function getRecommendation(input: RecommendationInput): Recommendation {
  const { energy, skipsLast7Days, completionsLast7Days, lastRecommendationId } =
    input;

  // Rule 1: Low energy OR high skip count → ultra-low-barrier reset
  if (energy === "low" || skipsLast7Days >= 2) {
    return {
      session: findByTone("reset", lastRecommendationId),
      rationale: "Lowering the barrier to help you restart gently.",
      rule:
        energy === "low"
          ? `Energy is low → suggesting a short reset session.`
          : `${skipsLast7Days} skips this week → lowering the ask to help you show up.`,
    };
  }

  // Rule 2: High energy AND good consistency → longer flow session
  if (energy === "high" && completionsLast7Days >= 2) {
    return {
      session: findByTone("energizing", lastRecommendationId),
      rationale:
        "You've been consistent — let's build momentum without intensity spikes.",
      rule: `High energy + ${completionsLast7Days} completions this week → a longer flow session.`,
    };
  }

  // Rule 3: Medium energy, few skips → gentle middle path
  if (energy === "medium" && skipsLast7Days < 2) {
    return {
      session: findByTone("gentle", lastRecommendationId),
      rationale: "Steady support to maintain your rhythm.",
      rule: `Medium energy, few skips → a gentle session to keep the streak alive.`,
    };
  }

  // Default: gentle
  return {
    session: findByTone("gentle", lastRecommendationId),
    rationale: "A gentle session feels right for today.",
    rule: `Default recommendation → gentle session to keep things easy.`,
  };
}

export function getRecommendations(input: RecommendationInput): Recommendation[] {
  const { energy, skipsLast7Days, completionsLast7Days, lastRecommendationId } = input;

  // Determine primary tone (same rules as getRecommendation)
  let primaryTone: Session["tone"];
  let rationale: string;
  let rule: string;

  if (energy === "low" || skipsLast7Days >= 2) {
    primaryTone = "reset";
    rationale = "Lowering the barrier to help you restart gently.";
    rule =
      energy === "low"
        ? "Energy is low → suggesting a short reset session."
        : `${skipsLast7Days} skips this week → lowering the ask to help you show up.`;
  } else if (energy === "high" && completionsLast7Days >= 2) {
    primaryTone = "energizing";
    rationale =
      "You've been consistent — let's build momentum without intensity spikes.";
    rule = `High energy + ${completionsLast7Days} completions this week → a longer flow session.`;
  } else if (energy === "medium" && skipsLast7Days < 2) {
    primaryTone = "gentle";
    rationale = "Steady support to maintain your rhythm.";
    rule =
      "Medium energy, few skips → a gentle session to keep the streak alive.";
  } else {
    primaryTone = "gentle";
    rationale = "A gentle session feels right for today.";
    rule = "Default recommendation → gentle session to keep things easy.";
  }

  const adjacentTone: Session["tone"] =
    primaryTone === "energizing"
      ? "gentle"
      : primaryTone === "reset"
      ? "gentle"
      : "reset";

  const primaryPool = catalog.filter(
    (s) => s.tone === primaryTone && s.id !== lastRecommendationId
  );
  const adjacentPool = catalog.filter((s) => s.tone === adjacentTone);
  const pool = [...primaryPool, ...adjacentPool];

  const picked: Session[] = [];
  for (const s of pool) {
    if (picked.length >= 3) break;
    if (!picked.find((p) => p.id === s.id)) picked.push(s);
  }

  return picked.map((session, i) => ({
    session,
    rationale:
      i === 0
        ? rationale
        : "Another gentle way to start today — pick what feels right.",
    rule:
      i === 0
        ? rule
        : `Alternative suggestion — a different starting point for ${energy} energy.`,
  }));
}
