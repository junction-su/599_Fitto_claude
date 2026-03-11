import { EnergyLevel } from "./engine/recommendation";

export interface FittoEvent {
  type: "done" | "skip";
  at: string; // ISO string
  sessionId: string;
}

export interface FittoState {
  energy: EnergyLevel | null;
  events: FittoEvent[];
  lastRecommendationId?: string;
}

const STORAGE_KEY = "fitto-state";

const defaultState: FittoState = {
  energy: null,
  events: [],
  lastRecommendationId: undefined,
};

export function loadState(): FittoState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return JSON.parse(raw) as FittoState;
  } catch {
    return defaultState;
  }
}

export function saveState(state: FittoState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

function isWithinLast7Days(isoString: string): boolean {
  const date = new Date(isoString);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return date >= sevenDaysAgo;
}

export function countSkipsLast7Days(events: FittoEvent[]): number {
  return events.filter(
    (e) => e.type === "skip" && isWithinLast7Days(e.at)
  ).length;
}

export function countCompletionsLast7Days(events: FittoEvent[]): number {
  return events.filter(
    (e) => e.type === "done" && isWithinLast7Days(e.at)
  ).length;
}

/** Returns an array of 7 entries (oldest→newest), each with done/skip counts for that day. */
export function getRhythmLast7Days(
  events: FittoEvent[]
): { date: string; done: number; skip: number }[] {
  const days: { date: string; done: number; skip: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayEvents = events.filter((e) => e.at.slice(0, 10) === dateStr);
    days.push({
      date: dateStr,
      done: dayEvents.filter((e) => e.type === "done").length,
      skip: dayEvents.filter((e) => e.type === "skip").length,
    });
  }
  return days;
}

export interface StreakInfo {
  count: number;
  lastEventWasSkip: boolean;
  hadStreakBeforeSkip: boolean;
}

/** Compute current completion streak (consecutive days with ≥1 done, ending today or yesterday). */
export function getStreakInfo(events: FittoEvent[]): StreakInfo {
  const lastEvent = [...events].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  )[0];
  const lastEventWasSkip = lastEvent?.type === "skip";

  // Build a set of date strings that have at least one completion
  const completionDates = new Set<string>();
  for (const e of events) {
    if (e.type === "done") {
      completionDates.add(e.at.slice(0, 10));
    }
  }

  // Count consecutive days backwards from today
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    if (completionDates.has(dateStr)) {
      streak++;
    } else {
      // Allow skipping today if no activity yet (check from yesterday)
      if (i === 0) continue;
      break;
    }
  }

  // Determine if user had a streak before their most recent skip
  const hadStreakBeforeSkip = lastEventWasSkip && streak > 0;

  return { count: streak, lastEventWasSkip, hadStreakBeforeSkip };
}
