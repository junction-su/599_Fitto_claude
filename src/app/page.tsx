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
  getRhythmLast7Days,
  getStreakInfo,
  FittoState,
} from "@/lib/storage";
import Link from "next/link";

const ENERGY_OPTIONS: { value: EnergyLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
  const rhythm = getRhythmLast7Days(state.events);
  const streak = getStreakInfo(state.events);

  // State-based streak copy
  const streakCopy = (() => {
    if (streak.lastEventWasSkip && streak.count > 0) {
      return { title: "Your streak paused.", body: "We'll help you restart gently." };
    }
    if (streak.lastEventWasSkip && streak.count === 0) {
      return { title: "That's okay.", body: "Rest is part of the rhythm." };
    }
    if (streak.count >= 7) {
      return { title: `${streak.count} day streak`, body: "Your rhythm is getting stronger." };
    }
    if (streak.count >= 2) {
      return { title: `${streak.count} day streak`, body: "Consistency builds gradually." };
    }
    if (streak.count === 1) {
      return { title: "You showed up today.", body: "A gentle start still counts." };
    }
    return { title: "Your journey starts here.", body: "Pick your energy level and begin." };
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
        <h2 className="mb-3 text-lg font-semibold text-fitto-text">
          Your Journey
        </h2>
        <div className="overflow-hidden rounded-2xl bg-fitto-card">
          {/* Streak card — icon left, copy right */}
          <div className="flex items-stretch">
            {/* Left: streak icon block */}
            <div className="relative flex w-28 shrink-0 flex-col items-center justify-center bg-fitto-accent/[0.07] py-5">
              {/* Subtle glow behind flame */}
              {streak.count > 0 && (
                <span
                  className="pointer-events-none absolute left-1/2 top-1/3 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(111,125,90,0.25) 0%, transparent 70%)",
                    filter: "blur(12px)",
                  }}
                />
              )}
              {/* Flame icon */}
              <svg
                viewBox="0 0 24 24"
                className={`relative h-9 w-9 transition-colors ${
                  streak.count > 0
                    ? "text-fitto-accent"
                    : "text-fitto-muted/40"
                }`}
                fill="currentColor"
              >
                <path d="M12 23c-4.97 0-8-3.03-8-7.5 0-3.09 1.74-5.64 3.28-7.35a.75.75 0 0 1 1.22.2c.53 1.12 1.32 2.04 2.18 2.6.12-.9.42-2.1 1.2-3.33C13.2 5.4 15.08 3.6 18.04 2a.75.75 0 0 1 1.1.75c-.3 2.1-.02 3.72.62 5.03.62 1.27 1.56 2.2 2.36 2.97.14.14.22.33.22.53 0 .11-.02.21-.06.31C21.42 14.14 20 17.5 20 17.5c0 2.97-3.03 5.5-8 5.5Zm-1.5-8.5c0 1.77.73 2.87 1.5 3.46.77-.59 1.5-1.69 1.5-3.46 0-.97-.36-1.83-.78-2.53a7.1 7.1 0 0 1-.72 1.03.75.75 0 0 1-1.22-.2 6.52 6.52 0 0 1-.28-.7c-.12.56-.2 1.26-.2 2.4h.2Z" />
              </svg>
              {/* Count */}
              <p className="relative mt-1.5 text-center">
                <span
                  className={`text-xl font-bold ${
                    streak.count > 0
                      ? "text-fitto-text"
                      : "text-fitto-muted/50"
                  }`}
                >
                  {streak.count}
                </span>
                <span className="ml-1 text-xs text-fitto-muted">
                  {streak.count === 1 ? "day" : "days"}
                </span>
              </p>
            </div>

            {/* Right: encouragement copy */}
            <div className="flex flex-col justify-center px-5 py-5">
              <h3 className="text-base font-bold text-fitto-text">
                {streakCopy.title}
              </h3>
              <p className="mt-1 text-sm text-fitto-muted">
                {streakCopy.body}
              </p>
            </div>
          </div>

          {/* Weekly progress row */}
          <div className="border-t border-fitto-muted/10 px-4 py-3.5">
            <div className="flex justify-between">
              {rhythm.map((day) => {
                const hasDone = day.done > 0;
                const hasSkip = day.skip > 0 && !hasDone;
                const dayDate = new Date(day.date + "T12:00:00");
                const dayLabel =
                  DAY_LABELS[
                    dayDate.getDay() === 0 ? 6 : dayDate.getDay() - 1
                  ];
                return (
                  <div
                    key={day.date}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                        hasDone
                          ? "bg-fitto-accent"
                          : hasSkip
                          ? "bg-fitto-muted/20"
                          : "bg-fitto-bg"
                      }`}
                      title={`${day.date}: ${day.done} done, ${day.skip} skipped`}
                    >
                      {hasDone && (
                        <svg
                          className="h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
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
                    <span className="text-[10px] font-medium text-fitto-muted">
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
