"use client";

import { useEffect, useState, useCallback } from "react";
import {
  EnergyLevel,
  getRecommendation,
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

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function HomePage() {
  const [state, setState] = useState<FittoState | null>(null);
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    setState(loadState());
  }, []);

  // Recompute recommendation whenever state changes
  const computeRec = useCallback(
    (s: FittoState) => {
      if (!s.energy) {
        setRec(null);
        return;
      }
      const skips = countSkipsLast7Days(s.events);
      const completions = countCompletionsLast7Days(s.events);
      const r = getRecommendation({
        energy: s.energy,
        skipsLast7Days: skips,
        completionsLast7Days: completions,
        lastRecommendationId: s.lastRecommendationId,
      });
      setRec(r);
      // Persist last recommendation
      const updated = { ...s, lastRecommendationId: r.session.id };
      saveState(updated);
    },
    []
  );

  useEffect(() => {
    if (state) computeRec(state);
  }, [state, computeRec]);

  const setEnergy = (energy: EnergyLevel) => {
    const updated = { ...state!, energy };
    setState(updated);
    saveState(updated);
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
    setRec(null);
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

      {/* Suggestion Card */}
      {rec && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-fitto-text">
            Today&apos;s gentle suggestion
          </h2>
          <div className="relative overflow-hidden rounded-2xl bg-fitto-card p-6">
            {/* Animated blobs */}
            <span
              className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 animate-blob-1 rounded-full opacity-40"
              style={{
                background:
                  "radial-gradient(circle, rgba(111,125,90,0.25) 0%, transparent 70%)",
                filter: "blur(30px)",
              }}
            />
            <span
              className="pointer-events-none absolute -bottom-6 right-4 h-28 w-28 animate-blob-2 rounded-full opacity-35"
              style={{
                background:
                  "radial-gradient(circle, rgba(138,129,120,0.2) 0%, transparent 70%)",
                filter: "blur(25px)",
              }}
            />
            <span
              className="pointer-events-none absolute right-1/3 top-1/2 h-24 w-24 animate-blob-3 rounded-full opacity-30"
              style={{
                background:
                  "radial-gradient(circle, rgba(111,125,90,0.15) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />

            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-fitto-accent/10 px-2.5 py-0.5 text-xs font-medium text-fitto-accent">
                  {rec.session.tag}
                </span>
                <span className="text-xs text-fitto-muted">
                  {rec.session.durationMin} min
                </span>
                <span className="rounded-full bg-fitto-accent/10 px-2.5 py-0.5 text-xs font-medium text-fitto-accent">
                  Beginner-friendly
                </span>
              </div>
              <h3 className="mt-3 text-xl font-bold text-fitto-text">
                {rec.session.title}
              </h3>
              <p className="mt-1.5 text-sm text-fitto-muted">
                {rec.session.description}
              </p>
              <Link
                href={`/session/${rec.session.id}`}
                className="mt-5 block rounded-xl bg-fitto-accent py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-fitto-accent-hover"
              >
                Begin when you&apos;re ready
              </Link>
              <p className="mt-2.5 text-center text-xs text-fitto-muted">
                Chosen based on your current energy and recent rhythm
              </p>
            </div>
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
                  {rec.rule}
                </p>
                <p className="text-fitto-muted">
                  <span className="font-medium text-fitto-text">
                    Rationale:{" "}
                  </span>
                  {rec.rationale}
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* No energy selected prompt */}
      {!rec && !state.energy && (
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
        >
          {/* Left column: streak card spanning both rows */}
          <div
            className="row-span-2 mr-3 flex flex-col items-center justify-center rounded-xl bg-fitto-bg"
            style={{ marginTop: 1 }}
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
          <div className="mt-1.5 rounded-lg bg-fitto-bg px-2 py-1.5">
            <div className="flex justify-between">
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
                        width: hasDone ? 26 : 22,
                        height: hasDone ? 26 : 22,
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
