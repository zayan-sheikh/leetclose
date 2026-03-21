import type { Persona } from "./personas";
import { PERSONAS } from "./personas";

const PROGRESS_KEY = "closearena_progress";
const LEADERBOARD_KEY = "closearena_leaderboard_entries";

export interface UserProgress {
  xp: number;
  level: number;
  streak: number;
  lastPracticeDate: string | null; // YYYY-MM-DD local
  badges: string[];
  unlockedPersonaIds: string[];
  unlockedDifficulties: ("beginner" | "intermediate" | "advanced" | "killer")[];
  dailyChallengeDate: string | null;
  dailyChallengeDone: boolean;
  totalCalls: number;
  bestOverall: number;
}

export const BADGE_DEFS: { id: string; label: string; description: string }[] = [
  { id: "objection_killer", label: "Objection killer", description: "Score 80+ on objection handling" },
  { id: "pain_sniper", label: "Pain sniper", description: "Score 80+ on pain extraction" },
  { id: "paid_in_full_closer", label: "Paid-in-full closer", description: "Sent Stripe link + 75+ overall" },
  { id: "frame_holder", label: "Frame holder", description: "80+ on call control / confidence combo" },
  { id: "no_choke_closer", label: "No-choke closer", description: "70+ closing with 60+ confidence" },
  { id: "streak_3", label: "On fire", description: "3-day practice streak" },
  { id: "streak_7", label: "Committed", description: "7-day practice streak" },
  { id: "xp_1k", label: "Grinder", description: "Earn 1,000 XP" },
];

const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 1800, 3000, 5000];

export function levelFromXp(xp: number): number {
  let lv = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      lv = i + 1;
      break;
    }
  }
  return Math.min(lv, LEVEL_THRESHOLDS.length);
}

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yesterdayLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function defaultProgress(): UserProgress {
  return {
    xp: 0,
    level: 1,
    streak: 0,
    lastPracticeDate: null,
    badges: [],
    unlockedPersonaIds: [],
    unlockedDifficulties: ["beginner"],
    dailyChallengeDate: null,
    dailyChallengeDone: false,
    totalCalls: 0,
    bestOverall: 0,
  };
}

export function loadProgress(): UserProgress {
  if (typeof window === "undefined") return defaultProgress();
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return defaultProgress();
    return { ...defaultProgress(), ...JSON.parse(raw) };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(p: UserProgress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

export interface CallScoreSnapshot {
  overall: number;
  discovery: number;
  painExtraction: number;
  objectionHandling: number;
  confidence: number;
  closing: number;
  rapport?: number;
  emotionalConnection?: number;
  callControl?: number;
  offerClarity?: number;
  paymentTiming?: number;
  stripeLinkSent?: boolean;
}

export function applyCallToProgress(
  prev: UserProgress,
  scores: CallScoreSnapshot,
  displayName: string
): UserProgress {
  const next = { ...prev };
  const day = todayLocal();
  const xpGain = Math.round(scores.overall * 1.2 + scores.objectionHandling * 0.3);
  next.xp += xpGain;
  next.level = levelFromXp(next.xp);
  next.totalCalls += 1;
  next.bestOverall = Math.max(next.bestOverall, scores.overall);

  if (next.lastPracticeDate === null) {
    next.streak = 1;
  } else if (next.lastPracticeDate === yesterdayLocal()) {
    next.streak += 1;
  } else if (next.lastPracticeDate === day) {
    /* same day — keep streak */
  } else {
    next.streak = 1;
  }
  next.lastPracticeDate = day;

  if (next.dailyChallengeDate !== day) {
    next.dailyChallengeDate = day;
    next.dailyChallengeDone = false;
  }
  if (scores.overall >= 65) next.dailyChallengeDone = true;

  const addBadge = (id: string) => {
    if (!next.badges.includes(id)) next.badges.push(id);
  };

  if (scores.objectionHandling >= 80) addBadge("objection_killer");
  if (scores.painExtraction >= 80) addBadge("pain_sniper");
  if (scores.stripeLinkSent && scores.overall >= 75) addBadge("paid_in_full_closer");
  const control = scores.callControl ?? scores.confidence;
  if (control >= 80 && scores.confidence >= 75) addBadge("frame_holder");
  if (scores.closing >= 70 && scores.confidence >= 60) addBadge("no_choke_closer");
  if (next.streak >= 3) addBadge("streak_3");
  if (next.streak >= 7) addBadge("streak_7");
  if (next.xp >= 1000) addBadge("xp_1k");

  if (scores.overall >= 72) {
    PERSONAS.filter((p) => !p.unlockedByDefault).forEach((p) => {
      if (!next.unlockedPersonaIds.includes(p.id)) {
        if (scores.overall >= 85 || next.totalCalls >= 5) {
          next.unlockedPersonaIds.push(p.id);
        }
      }
    });
    if (!next.unlockedDifficulties.includes("intermediate")) next.unlockedDifficulties.push("intermediate");
  }
  if (scores.overall >= 82) {
    if (!next.unlockedDifficulties.includes("advanced")) next.unlockedDifficulties.push("advanced");
  }
  if (scores.overall >= 90 && scores.objectionHandling >= 75) {
    if (!next.unlockedDifficulties.includes("killer")) next.unlockedDifficulties.push("killer");
  }

  appendLeaderboardLocal(displayName || "Coach", scores.overall, next.xp);

  return next;
}

interface BoardRow {
  name: string;
  score: number;
  xp: number;
  isYou?: boolean;
}

const MOCK_BOARD: BoardRow[] = [
  { name: "Jordan K.", score: 94, xp: 4200 },
  { name: "Mia T.", score: 91, xp: 3800 },
  { name: "Devon R.", score: 88, xp: 3100 },
  { name: "Casey L.", score: 85, xp: 2900 },
  { name: "Riley P.", score: 82, xp: 2400 },
];

function appendLeaderboardLocal(name: string, score: number, xp: number) {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    const rows: BoardRow[] = raw ? JSON.parse(raw) : [];
    rows.push({ name, score, xp, isYou: true });
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(rows.slice(-20)));
  } catch {
    /* ignore */
  }
}

export function getMergedLeaderboard(yourName: string, yourBest: number, yourXp: number): BoardRow[] {
  const rows: BoardRow[] = MOCK_BOARD.map((r) => ({ ...r }));
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LEADERBOARD_KEY);
      if (raw) {
        const saved: BoardRow[] = JSON.parse(raw);
        saved.forEach((r) => rows.push({ ...r, name: r.name, isYou: true }));
      }
    } catch {
      /* ignore */
    }
  }
  rows.push({ name: yourName || "You", score: yourBest, xp: yourXp, isYou: true });
  rows.sort((a, b) => b.score - a.score);
  return rows.slice(0, 15);
}

export function rankLabel(level: number): string {
  const ranks = ["Rookie", "Contender", "Pro", "Elite", "Closer", "Apex Closer", "Legend"];
  return ranks[Math.min(level - 1, ranks.length - 1)] ?? "Rookie";
}

export function personaAllowed(p: Persona, progress: UserProgress): boolean {
  if (p.unlockedByDefault) return true;
  return progress.unlockedPersonaIds.includes(p.id);
}
