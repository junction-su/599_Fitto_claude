"use client";

import { useEffect, useState, useCallback } from "react";
import {
  EnergyLevel,
  getRecommendations,
  Recommendation,
} from "@/lib/engine/recommendation";
import {
  loadState,
  saveState,
  clearState,
  countSkipsLast7Days,
  countCompletionsLast7Days,
  getCurrentWeekRhythm,
  getStreakInfo,
  FittoState,
} from "@/lib/storage";
import Link from "next/link";

const ENERGY_OPTIONS: { value: EnergyLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Soft muted tag colors per session category
function getTagStyle(tag: string): { background: string; color: string } {
  switch (tag) {
    case "Breathing": return { background: "rgba(99,149,210,0.14)", color: "#4A7BB5" };
    case "Walk":      return { background: "rgba(111,125,90,0.14)", color: "#6F7D5A" };
    case "Stretch":   return { background: "rgba(198,130,70,0.14)", color: "#A06828" };
    case "Mobility":  return { background: "rgba(198,120,80,0.13)", color: "#A06030" };
    case "Posture":   return { background: "rgba(140,110,175,0.13)", color: "#7B5E9A" };
    case "Core":      return { background: "rgba(185,90,90,0.13)",  color: "#9B4545" };
    default:          return { background: "rgba(111,125,90,0.12)", color: "#6F7D5A" };
  }
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function HomePage() {
  const [state, setState] = useState<FittoState | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [recIndex, setRecIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    setState(loadState());
  }, []);

  // Recompute recommendations whenever state changes
  const computeRec = useCallback((s: FittoState) => {
    if (!s.energy) {
      setRecs([]);
      setRecIndex(0);
      return;
    }
    const skips = countSkipsLast7Days(s.events);
    const completions = countCompletionsLast7Days(s.events);
    const results = getRecommendations({
      energy: s.energy,
      skipsLast7Days: skips,
      completionsLast7Days: completions,
      lastRecommendationId: s.lastRecommendationId,
    });
    setRecs(results);
    setRecIndex(0);
    const updated = { ...s, lastRecommendationId: results[0]?.session.id };
    saveState(updated);
  }, []);

  useEffect(() => {
    if (state) computeRec(state);
  }, [state, computeRec]);

  const setEnergy = (energy: EnergyLevel) => {
    const updated = { ...state!, energy };
    setState(updated);
    saveState(updated);
  };

  const handleSwap = () => {
    if (isExiting || recs.length < 2) return;
    // Phase 1: exit current card (180ms)
    setIsExiting(true);
    setTimeout(() => {
      // Phase 2: bring next card forward
      setRecIndex((prev) => (prev + 1) % recs.length);
      setIsExiting(false);
    }, 200);
  };

  // Demo controls
  const demoSimulateLowEnergy = () => {
    const updated = { ...state!, energy: "low" as EnergyLevel };
    setState(updated);
    saveState(updated);
  };

  const demoSimulateSkips = () => {
    const now = new Date();
    const events = [
      ...state!.events,
      {
        type: "skip" as const,
        at: new Date(now.getTime() - 86400000).toISOString(),
        sessionId: "breathing-reset",
      },
      {
        type: "skip" as const,
        at: new Date(now.getTime() - 86400000 * 2).toISOString(),
        sessionId: "gentle-stretch",
      },
    ];
    const updated = { ...state!, events };
    setState(updated);
    saveState(updated);
  };

  const demoSimulateHighConsistency = () => {
    const now = new Date();
    const events = [
      ...state!.events,
      {
        type: "done" as const,
        at: new Date(now.getTime() - 86400000).toISOString(),
        sessionId: "gentle-stretch",
      },
      {
        type: "done" as const,
        at: new Date(now.getTime() - 86400000 * 2).toISOString(),
        sessionId: "desk-mobility",
      },
      {
        type: "done" as const,
        at: new Date(now.getTime() - 86400000 * 3).toISOString(),
        sessionId: "flow-mobility",
      },
    ];
    const updated = { ...state!, energy: "high" as EnergyLevel, events };
    setState(updated);
    saveState(updated);
  };

  const demoReset = () => {
    clearState();
    const fresh: FittoState = { energy: null, events: [] };
    setState(fresh);
    setRecs([]);
    setRecIndex(0);
    setWhyOpen(false);
  };

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-fitto-accent border-t-transparent" />
      </div>
    );
  }

  const skips = countSkipsLast7Days(state.events);
  const completions = countCompletionsLast7Days(state.events);
  const rhythm = getCurrentWeekRhythm(state.events);
  const streak = getStreakInfo(state.events);

  // State-based streak copy (number lives in left card only — right side is emotional)
  const streakCopy = (() => {
    if (streak.lastEventWasSkip && streak.count > 0) {
      return { title: "Your streak paused.", body: "We\u2019ll help you restart gently." };
    }
    if (streak.lastEventWasSkip && streak.count === 0) {
      return { title: "That\u2019s okay.", body: "Rest is part of the rhythm." };
    }
    if (streak.count >= 7) {
      return { title: "Your rhythm is getting stronger.", body: "Small steps are adding up." };
    }
    if (streak.count >= 2) {
      return { title: "You showed up again.", body: "Consistency builds gradually." };
    }
    if (streak.count === 1) {
      return { title: "You showed up today.", body: "A gentle start still counts." };
    }
    return { title: "Start with what feels doable.", body: "Small steps still count." };
  })();

  return (
    <div className="pt-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fitto-text">
            Fitto
          </h1>
          <p className="mt-0.5 text-sm text-fitto-muted">{formatDate()}</p>
        </div>
        <button
          onClick={() => setDemoOpen(!demoOpen)}
          className="rounded-md border border-fitto-muted/30 px-2.5 py-1 text-xs text-fitto-muted transition-colors hover:border-fitto-muted/50 hover:text-fitto-text"
        >
          Demo
        </button>
      </header>

      {/* Demo Panel */}
      {demoOpen && (
        <div className="mt-4 rounded-xl border border-fitto-muted/20 bg-fitto-card p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fitto-muted">
            Demo Controls
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={demoSimulateLowEnergy}
              className="rounded-lg bg-fitto-bg px-3 py-1.5 text-xs font-medium text-fitto-text transition-colors hover:bg-fitto-muted/20"
            >
              Low Energy
            </button>
            <button
              onClick={demoSimulateSkips}
              className="rounded-lg bg-fitto-bg px-3 py-1.5 text-xs font-medium text-fitto-text transition-colors hover:bg-fitto-muted/20"
            >
              + 2 Skips
            </button>
            <button
              onClick={demoSimulateHighConsistency}
              className="rounded-lg bg-fitto-bg px-3 py-1.5 text-xs font-medium text-fitto-text transition-colors hover:bg-fitto-muted/20"
            >
              High Consistency
            </button>
            <button
              onClick={demoReset}
              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Energy Check-in */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-fitto-text">
          How&apos;s your energy today?
        </h2>
        <div className="mt-3 flex gap-3">
          {ENERGY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setEnergy(opt.value)}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all ${
                state.energy === opt.value
                  ? "bg-fitto-accent text-white shadow-sm"
                  : "bg-fitto-card text-fitto-text hover:bg-fitto-muted/15"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Suggestion Card Deck */}
      {recs.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2.5 text-lg font-semibold text-fitto-text">
            Today&apos;s gentle suggestion
          </h2>

          {/* Stacked card deck — matches Figma: all cards at same anchor, rotated */}
          <div className="relative" style={{ height: 400 }}>
            {recs.map((cardRec, cardIdx) => {
              const stackPos =
                (cardIdx - recIndex + recs.length) % recs.length;
              const isFront = stackPos === 0;

              return (
                <div
                  key={cardIdx}
                  style={{
                    position: "absolute",
                    width: 260,
                    height: 304,
                    left: "20%",
                    top: 72,
                    borderRadius: 32,
                    backgroundColor: isFront
                      ? "#F0ECE4"
                      : "rgba(161,174,136,0.2)",
                    boxShadow: isFront
                      ? "0 0 56px rgba(166,161,149,0.3)"
                      : "none",
                    zIndex: stackPos === 0 ? 30 : stackPos === 1 ? 20 : 10,
                    // Phase 1: front card exits (rotate back, shrink, fade)
                    // Phase 2: new front rises from ghost position naturally
                    transform:
                      stackPos === 0 && isExiting
                        ? "rotate(-7deg) scale(0.88) translateY(-12px)"
                        : stackPos === 0
                        ? "rotate(0deg) scale(1)"
                        : stackPos === 1
                        ? "rotate(-12.7762deg)"
                        : "rotate(-27.7762deg)",
                    opacity:
                      stackPos === 0 && isExiting
                        ? 0.2
                        : stackPos === 0
                        ? 1
                        : stackPos === 1
                        ? 0.75
                        : 0.6,
                    transition:
                      stackPos === 0 && isExiting
                        ? "transform 0.18s ease-in, opacity 0.18s ease-in"
                        : "transform 0.38s cubic-bezier(0.2,0,0,1), opacity 0.38s ease-out",
                    pointerEvents: isFront && !isExiting ? "auto" : "none",
                  }}
                >
                  {isFront && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        height: "100%",
                        padding: 16,
                      }}
                    >
                      {/* Tags row + swap button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={getTagStyle(cardRec.session.tag)}
                          >
                            {cardRec.session.tag}
                          </span>
                          <span className="text-xs text-fitto-muted">
                            {cardRec.session.durationMin} min
                          </span>
                        </div>
                        {/* Swap button — circle with exchange icon */}
                        <button
                          onClick={handleSwap}
                          disabled={isExiting}
                          aria-label="Try another suggestion"
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            backgroundColor: "#F7F4ED",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                            opacity: isExiting ? 0.4 : 1,
                            transition: "opacity 0.2s",
                            flexShrink: 0,
                          }}
                        >
                          <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.01514 9.79652V11.6055C3.01502 12.0806 3.1085 12.551 3.29023 12.99C3.47196 13.4289 3.73837 13.8278 4.07427 14.1638C4.41016 14.4997 4.80895 14.7662 5.24785 14.9481C5.68676 15.1299 6.15718 15.2235 6.63226 15.2235H17.4836M3.01514 5.2749H13.8665C14.3417 5.27479 14.8122 5.3683 15.2512 5.55008C15.6902 5.73186 16.0891 5.99835 16.4251 6.33433C16.761 6.67032 17.0275 7.0692 17.2093 7.50821C17.3911 7.94721 17.4846 8.41773 17.4845 8.89288V10.701" stroke="#526037" strokeWidth="1.28115" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14.7709 12.51L17.4844 15.2226L14.7709 17.9361M5.72764 7.98837L3.01416 5.27489L5.72764 2.56226" stroke="#526037" strokeWidth="1.28115" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>

                      {/* Title + description */}
                      <div>
                        <h3 className="text-xl font-bold text-fitto-text">
                          {cardRec.session.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-fitto-muted">
                          {cardRec.session.description}
                        </p>
                      </div>

                      {/* CTA */}
                      <Link
                        href={`/session/${cardRec.session.id}`}
                        className="block rounded-xl py-3.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: getTagStyle(cardRec.session.tag).color }}
                      >
                        Begin when you&apos;re ready
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Dot indicators */}
          <div className="mt-5 flex justify-center gap-1.5">
            {recs.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === recIndex ? 16 : 6,
                  height: 6,
                  backgroundColor:
                    i === recIndex
                      ? "#6F7D5A"
                      : "rgba(138,129,120,0.25)",
                }}
              />
            ))}
          </div>

          {/* Why this today? */}
          <button
            onClick={() => setWhyOpen(!whyOpen)}
            className="mt-3 flex items-center gap-1.5 text-sm font-medium text-fitto-muted transition-colors hover:text-fitto-text"
          >
            <span
              className={`inline-block transition-transform ${
                whyOpen ? "rotate-90" : ""
              }`}
            >
              ▸
            </span>
            Why this today?
          </button>
          {whyOpen && (
            <div className="mt-2 rounded-xl border border-fitto-muted/15 bg-fitto-card p-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-fitto-muted">Energy</span>
                  <span className="font-medium capitalize text-fitto-text">
                    {state.energy}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fitto-muted">Skips (7 days)</span>
                  <span className="font-medium text-fitto-text">{skips}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fitto-muted">
                    Completions (7 days)
                  </span>
                  <span className="font-medium text-fitto-text">
                    {completions}
                  </span>
                </div>
                <hr className="border-fitto-muted/15" />
                <p className="text-fitto-muted">
                  <span className="font-medium text-fitto-text">Rule: </span>
                  {recs[recIndex]?.rule}
                </p>
                <p className="text-fitto-muted">
                  <span className="font-medium text-fitto-text">
                    Rationale:{" "}
                  </span>
                  {recs[recIndex]?.rationale}
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* No energy selected prompt */}
      {recs.length === 0 && !state.energy && (
        <section className="mt-8">
          <div className="rounded-2xl border-2 border-dashed border-fitto-muted/20 p-8 text-center">
            <p className="text-sm text-fitto-muted">
              Select your energy level above to get a personalized suggestion.
            </p>
          </div>
        </section>
      )}

      {/* Your Journey */}
      <section className="mt-10">
        <h2 className="mb-2 text-lg font-semibold text-fitto-text">
          Your Journey
        </h2>
        <div
          className="grid grid-cols-[120px_1fr] rounded-2xl bg-fitto-card p-3"
          style={{ marginBottom: 1 }}
        >
          {/* Left column: streak card spanning both rows */}
          <div
            className="row-span-2 mr-3 flex flex-col items-center justify-center rounded-xl bg-fitto-bg py-4"
            style={{ marginTop: 1, marginBottom: 1 }}
          >
            {/* Flame + glow */}
            <div className="relative flex items-center justify-center">
              {streak.count > 0 && (
                <span
                  className="pointer-events-none absolute h-16 w-16 animate-flame-glow rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(111,125,90,0.35) 0%, rgba(111,125,90,0.1) 50%, transparent 70%)",
                    filter: "blur(10px)",
                  }}
                />
              )}
              {/* Flame SVG — exact shape from Figma */}
              <svg
                className={`relative h-12 w-12 ${
                  streak.count > 0 ? "animate-flame-breathe" : ""
                }`}
                style={{ marginTop: 2 }}
                viewBox="0 0 65 75"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M25.188 0C29.9132 0 38.0404 12.2935 38.0404 12.2935C38.0404 12.2935 41.6791 5.73952 45.9681 5.78423C50.257 5.82894 64.9703 24.0967 64.9703 39.9694C64.9703 55.8422 52.6269 74.0395 31.4188 74.0395C10.2106 74.0395 1.86414e-05 56.0475 0 39.9694C-1.86413e-05 23.8914 20.4629 0 25.188 0Z"
                  fill={streak.count > 0 ? "#6F7D5A" : "none"}
                  stroke={streak.count > 0 ? "none" : "#8A8178"}
                  strokeWidth={streak.count > 0 ? 0 : 1.5}
                  opacity={streak.count > 0 ? 1 : 0.2}
                />
                {streak.count > 0 && (
                  <path
                    d="M25.3306 28.829C27.9111 28.6168 34.2204 42.0648 37.8987 42.4179C40.6611 42.6831 42.7297 36.4847 45.363 36.4847C47.7232 36.4847 48.8704 41.6269 48.4892 45.6716C48.1079 49.7162 45.4569 55.2143 43.0025 57.0913C40.5481 58.9684 36.1568 60.6735 31.519 60.2812C22.8997 59.5522 16.5791 52.7707 16.1766 44.526C15.9296 39.466 21.2099 29.1678 25.3306 28.829Z"
                    fill="white"
                    opacity={0.9}
                  />
                )}
              </svg>
            </div>
            {/* Streak count + label */}
            <span
              className={`relative mt-2.5 text-xl font-bold leading-none ${
                streak.count > 0 ? "text-fitto-text" : "text-fitto-muted/35"
              }`}
            >
              {streak.count}{" "}
              <span className="text-sm font-semibold">
                {streak.count === 1 ? "day" : "days"}
              </span>
            </span>
            <span
              className={`relative mt-0.5 text-[9px] tracking-wide ${
                streak.count > 0 ? "text-fitto-muted/60" : "text-fitto-muted/30"
              }`}
            >
              streak
            </span>
          </div>

          {/* Right column, row 1: message block */}
          <div className="flex flex-col justify-center py-1">
            <h3
              className={`text-[15px] font-bold leading-tight ${
                streak.count > 0 ? "text-fitto-text" : "text-fitto-muted/70"
              }`}
            >
              {streakCopy.title}
            </h3>
            <p
              className={`mt-0.5 text-[13px] leading-snug ${
                streak.count > 0 ? "text-fitto-muted" : "text-fitto-muted/50"
              }`}
            >
              {streakCopy.body}
            </p>
          </div>

          {/* Right column, row 2: compact weekly strip */}
          <div className="mt-1.5 flex items-center rounded-lg bg-fitto-bg px-2 py-1.5">
            <div className="flex w-full items-center justify-between">
              {rhythm.map((day) => {
                const hasDone = day.done > 0;
                const hasSkip = day.skip > 0 && !hasDone;
                const dayDate = new Date(day.date + "T12:00:00");
                const dayLabel = DAY_LABELS[dayDate.getDay()];
                return (
                  <div
                    key={day.date}
                    className="flex flex-col items-center gap-0.5"
                  >
                    <div
                      className="flex items-center justify-center rounded-full transition-all"
                      style={{
                        width: 22,
                        height: 22,
                        backgroundColor: hasDone
                          ? "#6F7D5A"
                          : "#D9CEBC",
                        boxShadow: hasDone ? "0 1px 4px rgba(111,125,90,0.3)" : "none",
                      }}
                      title={`${day.date}: ${day.done} done, ${day.skip} skipped`}
                    >
                      {hasDone && (
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={3.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-[8px] font-medium text-fitto-muted/60">
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
