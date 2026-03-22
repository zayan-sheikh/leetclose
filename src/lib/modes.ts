export type TrainingModeId =
  | "quick_practice"
  | "full_call"
  | "objection_only"
  | "closing_only"
  | "rapid_fire_objections"
  | "tonality_practice"
  | "price_reveal"
  | "spouse_objection"
  | "paid_in_full_close";

export interface TrainingMode {
  id: TrainingModeId;
  label: string;
  description: string;
  /** Player-facing objectives (LeetCode-style “goals”) */
  goals: string[];
  /** Extra system instructions for the prospect */
  promptBlock: string;
}

export const TRAINING_MODES: TrainingMode[] = [
  {
    id: "quick_practice",
    label: "Quick practice",
    description: "Short call — rapport, one discovery loop, one objection.",
    goals: [
      "Open strong and establish rapport in the first 60 seconds.",
      "Run one tight discovery loop (situation → pain → impact).",
      "Handle at least one realistic objection without collapsing.",
    ],
    promptBlock:
      "MODE: QUICK PRACTICE — Keep the arc compressed. Move to at least one realistic objection within a few exchanges. Still sound human, not rushed-robotic.",
  },
  {
    id: "full_call",
    label: "Full sales call",
    description: "Full arc: intro through close simulation.",
    goals: [
      "Run rapport → situation → pain → emotional impact → goals → commitment before you transition to the offer.",
      "Ask and diagnose more than you pitch (NEPQ-style layering); earn the right to present price.",
      "After pitch: price reveal → payment ask → Stripe link if appropriate → objections → explicit close or next step.",
    ],
    promptBlock:
      "MODE: FULL CALL — Walk the full consultative framework in order when natural; compress only if the coach skips ahead (then resist until they diagnose). Reward questions and summaries before pitching.",
  },
  {
    id: "objection_only",
    label: "Objection only",
    description: "Prospect leads with pushback; coach practices reframes.",
    goals: [
      "Label and validate before you reframe.",
      "Ask a diagnostic question instead of arguing facts.",
      "End each exchange with a small commitment or clarity on the next step.",
    ],
    promptBlock:
      "MODE: OBJECTION DRILL — Open skeptical or concerned. Throw objections early and throughout. Let the coach practice diagnosis and reframes. Reward great questions.",
  },
  {
    id: "closing_only",
    label: "Closing only",
    description: "Assume discovery happened; focus on ask and payment link moment.",
    goals: [
      "Assume fit is mostly established — don’t re-do full discovery.",
      "Make a confident, specific ask (program, start date, investment).",
      "Handle late-stage hesitation (risk, timing, partner) without getting needy.",
    ],
    promptBlock:
      "MODE: CLOSING ONLY — Act as if pain and offer are mostly understood. Focus on commitment, price, payment link hesitation, and final objections. Still consistent with your persona.",
  },
  {
    id: "rapid_fire_objections",
    label: "Rapid-fire objections",
    description: "Faster objection rotation — high rep count.",
    goals: [
      "Keep answers short and structured under pressure.",
      "Don’t stack multiple rebuttals — one move, then a question.",
      "Stay calm when the prospect rotates objections quickly.",
    ],
    promptBlock:
      "MODE: RAPID-FIRE — Rotate objections more frequently than normal. Keep replies short. Coach must stay calm and structured.",
  },
  {
    id: "tonality_practice",
    label: "Tonality practice",
    description: "React to how the coach sounds on pressure vs calm prompts.",
    goals: [
      "Sound grounded and certain — not rushed or apologetic.",
      "If you feel “salesy,” slow down and ask a question.",
      "Match their energy without chasing approval.",
    ],
    promptBlock:
      "MODE: TONALITY — Be sensitive to pushy or needy language vs calm authority. If they sound scripted or desperate, pull back. If they sound grounded, engage more.",
  },
  {
    id: "price_reveal",
    label: "Price reveal practice",
    description: "Heavy focus on money tension and value framing.",
    goals: [
      "Anchor value before you state the number.",
      "When price lands, pause and let them react.",
      "Offer options (timeline, plan) without discounting your worth by default.",
    ],
    promptBlock:
      "MODE: PRICE REVEAL — When price comes up, react strongly and realistically. Test their framing, payment options, and confidence without being cartoonish.",
  },
  {
    id: "spouse_objection",
    label: "Spouse objection simulator",
    description: "Partner approval is the main resistance.",
    goals: [
      "Treat the partner objection as a process problem, not a hard no.",
      "Offer a respectful plan: what to say, what to send, when to reconvene.",
      "Avoid trash-talking the partner — align with their values.",
    ],
    promptBlock:
      "MODE: SPOUSE OBJECTION — Center partner/spouse dynamics. Use variations of needing to check in at home, joint finances, and fear of judgment.",
  },
  {
    id: "paid_in_full_close",
    label: "Paid-in-full close",
    description: "Practice asking for pay-in-full vs plans.",
    goals: [
      "Present paid-in-full as the default best outcome.",
      "If they resist, explain tradeoffs clearly (risk, commitment, results).",
      "If you offer a plan, keep control of the terms.",
    ],
    promptBlock:
      "MODE: PAID IN FULL — When they move to payment, resist a little on payment plans vs paid-in-full if they push PIF. Stay realistic for your persona's budget sensitivity.",
  },
];

export function getModeById(id: string | undefined): TrainingMode {
  const m = TRAINING_MODES.find((x) => x.id === id);
  return m ?? TRAINING_MODES[1];
}
