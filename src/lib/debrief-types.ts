export interface DebriefObjectiveResult {
  index: number;
  met: boolean;
  note: string;
}

export interface AiDebrief {
  modeObjectives: DebriefObjectiveResult[];
  personaObjectives: DebriefObjectiveResult[];
  coachSummary: string;
  strengths: string[];
  improvements: string[];
  betterLines: string[];
  retryChallenge: string;
}

function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function parseObjectiveList(
  raw: unknown,
  count: number,
): DebriefObjectiveResult[] {
  const arr = Array.isArray(raw) ? raw : [];
  const out: DebriefObjectiveResult[] = [];
  for (let i = 0; i < count; i++) {
    const byIndex = arr.find(
      (item) => isObj(item) && Number(item.index) === i,
    ) as Record<string, unknown> | undefined;
    const fallback = isObj(arr[i]) ? (arr[i] as Record<string, unknown>) : {};
    const item = byIndex ?? fallback;
    const note =
      typeof item.note === "string"
        ? item.note.slice(0, 280)
        : typeof item.reason === "string"
          ? item.reason.slice(0, 280)
          : "";
    out.push({
      index: i,
      met: Boolean(item.met),
      note,
    });
  }
  return out;
}

function strArray(x: unknown, max: number): string[] {
  if (!Array.isArray(x)) return [];
  return x
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, max);
}

/** Parse model JSON; `modeCount` / `personaCount` fill missing indices. */
export function parseAiDebriefPayload(
  raw: unknown,
  modeCount: number,
  personaCount: number,
): AiDebrief | null {
  if (!isObj(raw)) return null;
  const coachSummary =
    typeof raw.coachSummary === "string" ? raw.coachSummary.trim() : "";
  const retryChallenge =
    typeof raw.retryChallenge === "string" ? raw.retryChallenge.trim() : "";

  if (!coachSummary || coachSummary.length < 8) return null;

  return {
    modeObjectives: parseObjectiveList(raw.modeObjectives, modeCount),
    personaObjectives: parseObjectiveList(
      raw.personaObjectives,
      personaCount,
    ),
    coachSummary,
    strengths: strArray(raw.strengths, 6),
    improvements: strArray(raw.improvements, 6),
    betterLines: strArray(raw.betterLines, 5),
    retryChallenge: retryChallenge || "Run the same mode again; pick one skill to exaggerate.",
  };
}

export function extractJsonObject(text: string): unknown {
  const t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence ? fence[1].trim() : t;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1)) as unknown;
  } catch {
    return null;
  }
}
