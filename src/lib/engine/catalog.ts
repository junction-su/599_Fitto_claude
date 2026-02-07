export interface Session {
  id: string;
  title: string;
  durationMin: number;
  tag: string;
  tone: "reset" | "gentle" | "energizing";
  description: string;
}

export const catalog: Session[] = [
  // Reset sessions (2-3 min)
  {
    id: "breathing-reset",
    title: "Breathing Reset",
    durationMin: 2,
    tag: "Breathing",
    tone: "reset",
    description: "Simple box breathing to settle your nervous system.",
  },
  {
    id: "posture-reset",
    title: "Posture Reset",
    durationMin: 3,
    tag: "Posture",
    tone: "reset",
    description: "Gentle standing posture check and shoulder release.",
  },
  {
    id: "calm-body-scan",
    title: "Calm Body Scan",
    durationMin: 3,
    tag: "Breathing",
    tone: "reset",
    description: "A slow scan from head to toes — just noticing, no effort.",
  },
  // Gentle sessions (5-6 min)
  {
    id: "gentle-stretch",
    title: "Gentle Full-Body Stretch",
    durationMin: 5,
    tag: "Stretch",
    tone: "gentle",
    description: "Easy head-to-toe stretches you can do anywhere.",
  },
  {
    id: "desk-mobility",
    title: "Desk Mobility Flow",
    durationMin: 5,
    tag: "Mobility",
    tone: "gentle",
    description: "Wrists, neck, and hips — perfect for desk workers.",
  },
  {
    id: "morning-wake-up",
    title: "Morning Wake-Up Stretch",
    durationMin: 6,
    tag: "Stretch",
    tone: "gentle",
    description: "Ease into your day with slow, feel-good stretches.",
  },
  {
    id: "light-walk-prep",
    title: "Light Walk Prep",
    durationMin: 5,
    tag: "Walk",
    tone: "gentle",
    description: "Ankle circles, calf raises, and a 3-minute easy walk.",
  },
  // Energizing sessions (8-10 min)
  {
    id: "flow-mobility",
    title: "Flow Mobility Sequence",
    durationMin: 8,
    tag: "Mobility",
    tone: "energizing",
    description: "Fluid movement connecting breath to gentle full-body motion.",
  },
  {
    id: "calm-core",
    title: "Calm Core Activation",
    durationMin: 8,
    tag: "Core",
    tone: "energizing",
    description: "Controlled core work — no crunches, just engagement.",
  },
  {
    id: "energizing-walk",
    title: "Energizing Walk",
    durationMin: 10,
    tag: "Walk",
    tone: "energizing",
    description: "Brisk walking intervals with easy-pace recovery.",
  },
  {
    id: "full-body-gentle-flow",
    title: "Full-Body Gentle Flow",
    durationMin: 10,
    tag: "Mobility",
    tone: "energizing",
    description: "A longer sequence building on mobility and breath.",
  },
];

export function getSessionById(id: string): Session | undefined {
  return catalog.find((s) => s.id === id);
}
