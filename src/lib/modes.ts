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
  /** Extra system instructions for the prospect */
  promptBlock: string;
}

export const TRAINING_MODES: TrainingMode[] = [
  {
    id: "quick_practice",
    label: "Quick practice",
    description: "Short call — rapport, one discovery loop, one objection.",
    promptBlock:
      "MODE: QUICK PRACTICE — Keep the arc compressed. Move to at least one realistic objection within a few exchanges. Still sound human, not rushed-robotic.",
  },
  {
    id: "full_call",
    label: "Full sales call",
    description: "Full arc: intro through close simulation.",
    promptBlock:
      "MODE: FULL CALL — Follow a natural consultative arc: rapport → situation → pain → impact → goals → transition → offer/price tension → payment conversation. Stay dynamic.",
  },
  {
    id: "objection_only",
    label: "Objection only",
    description: "Prospect leads with pushback; coach practices reframes.",
    promptBlock:
      "MODE: OBJECTION DRILL — Open skeptical or concerned. Throw objections early and throughout. Let the coach practice diagnosis and reframes. Reward great questions.",
  },
  {
    id: "closing_only",
    label: "Closing only",
    description: "Assume discovery happened; focus on ask and payment link moment.",
    promptBlock:
      "MODE: CLOSING ONLY — Act as if pain and offer are mostly understood. Focus on commitment, price, payment link hesitation, and final objections. Still consistent with your persona.",
  },
  {
    id: "rapid_fire_objections",
    label: "Rapid-fire objections",
    description: "Faster objection rotation — high rep count.",
    promptBlock:
      "MODE: RAPID-FIRE — Rotate objections more frequently than normal. Keep replies short. Coach must stay calm and structured.",
  },
  {
    id: "tonality_practice",
    label: "Tonality practice",
    description: "React to how the coach sounds on pressure vs calm prompts.",
    promptBlock:
      "MODE: TONALITY — Be sensitive to pushy or needy language vs calm authority. If they sound scripted or desperate, pull back. If they sound grounded, engage more.",
  },
  {
    id: "price_reveal",
    label: "Price reveal practice",
    description: "Heavy focus on money tension and value framing.",
    promptBlock:
      "MODE: PRICE REVEAL — When price comes up, react strongly and realistically. Test their framing, payment options, and confidence without being cartoonish.",
  },
  {
    id: "spouse_objection",
    label: "Spouse objection simulator",
    description: "Partner approval is the main resistance.",
    promptBlock:
      "MODE: SPOUSE OBJECTION — Center partner/spouse dynamics. Use variations of needing to check in at home, joint finances, and fear of judgment.",
  },
  {
    id: "paid_in_full_close",
    label: "Paid-in-full close",
    description: "Practice asking for pay-in-full vs plans.",
    promptBlock:
      "MODE: PAID IN FULL — When they move to payment, resist a little on payment plans vs paid-in-full if they push PIF. Stay realistic for your persona's budget sensitivity.",
  },
];

export function getModeById(id: string | undefined): TrainingMode {
  const m = TRAINING_MODES.find((x) => x.id === id);
  return m ?? TRAINING_MODES[1];
}
