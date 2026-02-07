"use client";

import { useEffect, useState, useRef } from "react";
import { getSessionById, Session } from "@/lib/engine/catalog";
import { loadState, saveState, FittoEvent } from "@/lib/storage";
import { useRouter } from "next/navigation";

type Status = "active" | "done" | "skipped";

export default function SessionPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<Status>("active");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const found = getSessionById(id);
    if (!found) {
      router.replace("/");
      return;
    }
    setSession(found);
  }, [id, router]);

  // Timer
  useEffect(() => {
    if (status !== "active") return;
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const logEvent = (type: "done" | "skip") => {
    const state = loadState();
    const event: FittoEvent = {
      type,
      at: new Date().toISOString(),
      sessionId: id,
    };
    state.events.push(event);
    saveState(state);
  };

  const handleDone = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    logEvent("done");
    setStatus("done");
  };

  const handleSkip = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    logEvent("skip");
    setStatus("skipped");
  };

  const goHome = () => {
    router.push("/");
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-fitto-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center pt-6">
      {status === "active" && (
        <>
          <span className="rounded-full bg-fitto-accent/10 px-3 py-1 text-xs font-medium text-fitto-accent">
            {session.tag} · {session.durationMin} min
          </span>
          <h1 className="mt-4 text-center text-2xl font-bold text-fitto-text">
            {session.title}
          </h1>
          <p className="mt-2 text-center text-sm text-fitto-muted">
            {session.description}
          </p>

          {/* Timer */}
          <div className="mt-10 text-5xl font-light tabular-nums tracking-wider text-fitto-text">
            {formatTime(elapsed)}
          </div>
          <p className="mt-1 text-xs text-fitto-muted">
            Suggested: ~{session.durationMin} min — go at your own pace
          </p>

          {/* Actions */}
          <div className="mt-10 flex w-full max-w-xs gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 rounded-xl border border-fitto-muted/30 py-3.5 text-sm font-semibold text-fitto-muted transition-colors hover:border-fitto-muted/50 hover:text-fitto-text"
            >
              Skip
            </button>
            <button
              onClick={handleDone}
              className="flex-1 rounded-xl bg-fitto-accent py-3.5 text-sm font-semibold text-white transition-colors hover:bg-fitto-accent-hover"
            >
              Done
            </button>
          </div>
        </>
      )}

      {status === "done" && (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-fitto-accent/10">
            <svg
              className="h-8 w-8 text-fitto-accent"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-fitto-text">
            Nicely done.
          </h1>
          <p className="mt-2 text-sm text-fitto-muted">
            You showed up today — that&apos;s what matters most.
          </p>
          <button
            onClick={goHome}
            className="mt-8 rounded-xl bg-fitto-accent px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-fitto-accent-hover"
          >
            Back to Home
          </button>
        </div>
      )}

      {status === "skipped" && (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-fitto-muted/10">
            <svg
              className="h-8 w-8 text-fitto-muted"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 9h16.5m-16.5 6.75h16.5"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-fitto-text">
            No worries.
          </h1>
          <p className="mt-2 text-sm text-fitto-muted">
            Rest is part of the journey. We&apos;ll be here when you&apos;re
            ready.
          </p>
          <button
            onClick={goHome}
            className="mt-8 rounded-xl bg-fitto-accent px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-fitto-accent-hover"
          >
            Back to Home
          </button>
        </div>
      )}
    </div>
  );
}
