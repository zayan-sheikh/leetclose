import { analyzeCallFull, type CallData, type FullScores } from "./call-analysis";
import { getModeById, type TrainingModeId } from "./modes";
import { getPersonaById } from "./personas";

function prospectShowedPushback(data: CallData): boolean {
  const signals = [
    "expensive",
    "think about",
    "husband",
    "wife",
    "partner",
    "don't have time",
    "not sure",
    "guarantee",
    "need to ask",
    "too much",
  ];
  return data.messages
    .filter((m) => m.role === "prospect")
    .some((m) => signals.some((s) => m.content.toLowerCase().includes(s)));
}

function coachText(data: CallData): string {
  return data.messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.toLowerCase())
    .join(" ");
}

function modeGoalMet(
  modeId: TrainingModeId,
  index: number,
  s: FullScores,
  data: CallData,
): boolean {
  const userN = data.messages.filter((m) => m.role === "user").length;
  const dur = data.duration;
  const ct = coachText(data);

  switch (modeId) {
    case "quick_practice":
      if (index === 0)
        return (s.rapport >= 42 || userN >= 2) && (dur >= 15 || userN >= 2);
      if (index === 1) return s.discovery >= 48 && s.painExtraction >= 42;
      if (index === 2)
        return (
          s.objectionHandling >= 45 &&
          (prospectShowedPushback(data) || userN >= 4)
        );
      return false;
    case "full_call":
      if (index === 0)
        return (
          s.discovery >= 52 &&
          s.painExtraction >= 48 &&
          s.emotionalConnection >= 40
        );
      if (index === 1) return s.discovery >= 55 && s.offerClarity >= 40;
      if (index === 2)
        return (
          (s.closing >= 42 && s.paymentTiming >= 38) ||
          data.stripeLinkSent === true
        );
      return false;
    case "objection_only":
      if (index === 0) return s.objectionHandling >= 52;
      if (index === 1) return s.discovery >= 44 || s.callControl >= 48;
      if (index === 2) return s.closing >= 38 || s.callControl >= 52;
      return false;
    case "closing_only":
      if (index === 0) return userN >= 2;
      if (index === 1) return s.closing >= 50 && s.confidence >= 48;
      if (index === 2) return s.objectionHandling >= 50;
      return false;
    case "rapid_fire_objections":
      if (index === 0) return s.confidence >= 48;
      if (index === 1) return s.objectionHandling >= 50;
      if (index === 2)
        return s.emotionalConnection >= 45 || s.objectionHandling >= 55;
      return false;
    case "tonality_practice":
      if (index === 0) return s.confidence >= 52 && s.callControl >= 48;
      if (index === 1) return s.discovery >= 45;
      if (index === 2) return s.emotionalConnection >= 48;
      return false;
    case "price_reveal":
      if (index === 0) return s.offerClarity >= 48;
      if (index === 1) return userN >= 3 && prospectShowedPushback(data);
      if (index === 2) return s.objectionHandling >= 48 || s.closing >= 45;
      return false;
    case "spouse_objection":
      if (index === 0) return s.objectionHandling >= 50;
      if (index === 1) return s.callControl >= 48 || s.closing >= 42;
      if (index === 2) return s.rapport >= 45 || s.emotionalConnection >= 45;
      return false;
    case "paid_in_full_close":
      if (index === 0)
        return (
          /\b(paid in full|pay in full|pif|upfront|one payment)\b/i.test(ct) ||
          s.closing >= 48
        );
      if (index === 1) return s.objectionHandling >= 48;
      if (index === 2) return s.callControl >= 50;
      return false;
    default:
      return false;
  }
}

function personaGoalMet(
  index: number,
  total: number,
  s: FullScores,
  data: CallData,
): boolean {
  const userN = data.messages.filter((m) => m.role === "user").length;
  if (userN < Math.min(index + 1, 2)) return false;

  if (total === 3) {
    const gates = [
      s.discovery >= 50,
      s.painExtraction >= 48,
      s.objectionHandling >= 50,
    ];
    return gates[index] ?? false;
  }

  const gates4 = [
    s.discovery >= 48,
    s.painExtraction >= 46,
    s.objectionHandling >= 46,
    s.closing >= 40 || data.stripeLinkSent === true,
  ];
  return gates4[Math.min(index, gates4.length - 1)] ?? s.overall >= 52;
}

/** Live / fallback objective completion from transcript heuristics (same engine as scores). */
export function estimateLiveObjectiveProgress(data: CallData): {
  modeMet: boolean[];
  personaMet: boolean[];
  scores: FullScores;
} {
  const { scores } = analyzeCallFull(data);
  const mode = getModeById(data.modeId);
  const modeMet = mode.goals.map((_, i) =>
    modeGoalMet(mode.id, i, scores, data),
  );
  const persona = getPersonaById(data.personaId);
  const n = persona.practiceObjectives.length;
  const personaMet = persona.practiceObjectives.map((_, i) =>
    personaGoalMet(i, n, scores, data),
  );
  return { modeMet, personaMet, scores };
}
