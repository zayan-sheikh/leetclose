export interface Persona {
  id: string;
  displayName: string;
  firstName: string;
  age: number;
  nicheGoal: string;
  backgroundStory: string;
  painPoints: string[];
  buyingResistance: string[];
  likelyObjections: string[];
  emotionalTriggers: string[];
  budgetSensitivity: "low" | "medium" | "high";
  urgencyLevel: "low" | "medium" | "high";
  trustLevel: "low" | "medium" | "high";
  personalityType: string;
  /** Default personas available without XP unlock */
  unlockedByDefault: boolean;
  objectionDifficulty: "beginner" | "intermediate" | "advanced" | "killer";
  /** Avatar color hint for UI */
  avatarTone: "warm" | "neutral" | "cool" | "deep";
  initialGreeting: string;
}

export const PERSONAS: Persona[] = [
  {
    id: "sarah-busy-mom",
    displayName: "Sarah Mitchell",
    firstName: "Sarah",
    age: 34,
    nicheGoal: "Lose fat, regain energy after kids",
    backgroundStory:
      "Marketing manager and mother of two. Gained weight after second pregnancy, gym membership fizzled, tried an online program alone and quit.",
    painPoints: [
      "Low energy affecting work",
      "Embarrassment about body",
      "No time with kids + career",
      "Guilt spending on self",
    ],
    buyingResistance: ["Price vs family budget", "Skeptical of online coaching", "Fear of failing again"],
    likelyObjections: [
      "That's more than I expected",
      "I need to talk to my husband",
      "I don't know if I have time",
      "I've tried programs before",
    ],
    emotionalTriggers: ["Being heard", "Small wins", "Accountability without judgment"],
    budgetSensitivity: "high",
    urgencyLevel: "medium",
    trustLevel: "medium",
    personalityType: "Friendly, guarded, opens up with good questions",
    unlockedByDefault: true,
    objectionDifficulty: "beginner",
    avatarTone: "warm",
    initialGreeting: "Hey! Yeah, I can hear you. How's it going?",
  },
  {
    id: "marcus-desk-job",
    displayName: "Marcus Chen",
    firstName: "Marcus",
    age: 38,
    nicheGoal: "Lose visceral fat, fix back pain from sitting",
    backgroundStory:
      "Software lead. 60-hour weeks, DoorDash dinners, hasn't trained consistently in years. Doctor mentioned blood pressure.",
    painPoints: ["Chronic tight lower back", "Winded climbing stairs", "Confidence in meetings"],
    buyingResistance: ["Time", "Thinks he can DIY with YouTube", "Price for something intangible"],
    likelyObjections: [
      "I can figure this out on my own",
      "I barely have time to eat",
      "Why is this better than a cheaper app?",
    ],
    emotionalTriggers: ["Efficiency", "Data", "No fluff"],
    budgetSensitivity: "medium",
    urgencyLevel: "medium",
    trustLevel: "low",
    personalityType: "Analytical, dry humor, tests if you are legit",
    unlockedByDefault: true,
    objectionDifficulty: "intermediate",
    avatarTone: "cool",
    initialGreeting: "Hey, you're coming through clear. What's this call about?",
  },
  {
    id: "ethan-hardgainer",
    displayName: "Ethan Brooks",
    firstName: "Ethan",
    age: 24,
    nicheGoal: "Build muscle — skinny guy bulk",
    backgroundStory:
      "Grad student. Ectomorph, eats 'a ton' but scale won't move. Tried bro splits, inconsistent.",
    painPoints: ["Invisible in social settings", "Strength plateau", "Confusing conflicting advice"],
    buyingResistance: ["Student budget", "Thinks genetics are the whole story"],
    likelyObjections: [
      "I'm broke right now",
      "Can you guarantee I'll gain muscle?",
      "I need to see the workouts first",
    ],
    emotionalTriggers: ["Being taken seriously", "Clear plan", "Proof of results"],
    budgetSensitivity: "high",
    urgencyLevel: "low",
    trustLevel: "medium",
    personalityType: "Eager but anxious, compares coaches online",
    unlockedByDefault: true,
    objectionDifficulty: "beginner",
    avatarTone: "neutral",
    initialGreeting: "Yo — hey, I can hear you. Cool.",
  },
  {
    id: "priya-accountability",
    displayName: "Priya Kapoor",
    firstName: "Priya",
    age: 31,
    nicheGoal: "Confidence + consistency, not just scale weight",
    backgroundStory:
      "Consultant. Yo-yo diets, emotional eating during stress. Wants accountability and identity shift.",
    painPoints: ["Shame cycles", "Travel disrupts routine", "Comparison on social media"],
    buyingResistance: ["Privacy", "Worried about toxic diet culture"],
    likelyObjections: [
      "Is this going to be super restrictive?",
      "I need to think about it",
      "Send me more info and I'll review",
    ],
    emotionalTriggers: ["Empathy", "Values alignment", "Gentle structure"],
    budgetSensitivity: "medium",
    urgencyLevel: "high",
    trustLevel: "medium",
    personalityType: "Warm, articulate, needs emotional safety",
    unlockedByDefault: true,
    objectionDifficulty: "intermediate",
    avatarTone: "warm",
    initialGreeting: "Hi! Yes I can hear you — thanks for making the time.",
  },
  {
    id: "jordan-calisthenics",
    displayName: "Jordan Reyes",
    firstName: "Jordan",
    age: 29,
    nicheGoal: "Calisthenics skills + lean physique",
    backgroundStory:
      "Former athlete. Wants pull-ups, handstands, outdoor training vibe. Skeptical of 'bodybuilding' style.",
    painPoints: ["Plateau on bodyweight", "Wrist issues", "Wants lifestyle fit"],
    buyingResistance: ["Identity — not a gym bro", "Price for non-barbell plan"],
    likelyObjections: [
      "Your price is too high for bodyweight stuff",
      "I want to wait until after my trip",
      "Why are you better than others?",
    ],
    emotionalTriggers: ["Respect for their style", "Progressions", "Injury-aware coaching"],
    budgetSensitivity: "medium",
    urgencyLevel: "low",
    trustLevel: "low",
    personalityType: "Independent, challenges authority politely",
    unlockedByDefault: true,
    objectionDifficulty: "intermediate",
    avatarTone: "deep",
    initialGreeting: "Hey hey — loud and clear. What are we walking through today?",
  },
  {
    id: "taylor-recomp",
    displayName: "Taylor Morgan",
    firstName: "Taylor",
    age: 33,
    nicheGoal: "Body recomposition — look athletic, keep strength",
    backgroundStory:
      "Former college athlete. Skinny-fat phase, wants visible abs without losing all strength.",
    painPoints: ["Confused by bulk/cut", "Weekend social eating", "Impatient for visuals"],
    buyingResistance: ["Wants proof fast", "Has tried macro apps"],
    likelyObjections: [
      "How fast will I see results?",
      "I need to ask someone before I commit",
      "Is this a scam?",
    ],
    emotionalTriggers: ["Clarity", "Realistic timelines", "Structure"],
    budgetSensitivity: "low",
    urgencyLevel: "high",
    trustLevel: "medium",
    personalityType: "Direct, wants specifics, competitive",
    unlockedByDefault: false,
    objectionDifficulty: "advanced",
    avatarTone: "neutral",
    initialGreeting: "Hey — good to connect. I've got like 30 minutes.",
  },
  {
    id: "high-intent-alex",
    displayName: "Alex Rivera",
    firstName: "Alex",
    age: 36,
    nicheGoal: "Fat loss for wedding in 4 months",
    backgroundStory:
      "High intent. Already sold on coaching concept, comparing two coaches. Will buy if trust + plan feel right.",
    painPoints: ["Deadline pressure", "Wants spouse on board"],
    buyingResistance: ["Choosing the right coach"],
    likelyObjections: [
      "What exactly do I get each week?",
      "Can I pay in full for a discount?",
    ],
    emotionalTriggers: ["Confidence", "Clear onboarding", "Partnership"],
    budgetSensitivity: "low",
    urgencyLevel: "high",
    trustLevel: "high",
    personalityType: "Decisive, cooperative, moves fast if respected",
    unlockedByDefault: false,
    objectionDifficulty: "beginner",
    avatarTone: "warm",
    initialGreeting: "Hi! I'm excited to chat — I've been following your content.",
  },
  {
    id: "skeptical-dana",
    displayName: "Dana Whitaker",
    firstName: "Dana",
    age: 42,
    nicheGoal: "Sustainable fat loss, skeptical of industry",
    backgroundStory:
      "Burned by a coach who ghosted after payment. Reads reviews, asks hard questions.",
    painPoints: ["Trust issues", "All-or-nothing history"],
    buyingResistance: ["Trust", "Contract terms", "Refund policy"],
    likelyObjections: [
      "I've been burned before",
      "Can you guarantee results?",
      "Why should I believe you?",
      "Send me the contract before I pay",
    ],
    emotionalTriggers: ["Transparency", "Boundaries", "No hype"],
    budgetSensitivity: "medium",
    urgencyLevel: "low",
    trustLevel: "low",
    personalityType: "Skeptical, sharp, loyal if won honestly",
    unlockedByDefault: false,
    objectionDifficulty: "killer",
    avatarTone: "cool",
    initialGreeting: "Hello. I'll be honest — I'm cautious, but I'm here.",
  },
  {
    id: "broke-but-interested",
    displayName: "Chris Okafor",
    firstName: "Chris",
    age: 27,
    nicheGoal: "Weight loss on a tight budget",
    backgroundStory:
      "Gig worker income varies. Wants help but terrified of payment. Motivated emotionally, financially stretched.",
    painPoints: ["Income volatility", "Shame about money", "Stress eating"],
    buyingResistance: ["Cash flow", "Fear of payment plans"],
    likelyObjections: [
      "I can't afford it right now",
      "Can we start smaller?",
      "I need to think about it",
    ],
    emotionalTriggers: ["Dignity", "Options", "Honest math"],
    budgetSensitivity: "high",
    urgencyLevel: "medium",
    trustLevel: "medium",
    personalityType: "Apologetic about money, hopeful",
    unlockedByDefault: true,
    objectionDifficulty: "intermediate",
    avatarTone: "deep",
    initialGreeting: "Hey… thanks for the call. I might be a mess financially but I'm serious.",
  },
  {
    id: "spouse-objection-ryan",
    displayName: "Ryan Gallagher",
    firstName: "Ryan",
    age: 40,
    nicheGoal: "Dad bod reset",
    backgroundStory:
      "Wants to buy; spouse thinks coaching is a luxury. Ryan is caught in the middle.",
    painPoints: ["Marital tension about spend", "Time guilt"],
    buyingResistance: ["Spouse approval"],
    likelyObjections: [
      "My wife won't be okay with the price",
      "I need to run it by my partner",
      "She thinks I can do it free with running",
    ],
    emotionalTriggers: ["Respect for family", "Framing for spouse"],
    budgetSensitivity: "high",
    urgencyLevel: "medium",
    trustLevel: "medium",
    personalityType: "Agreeable, conflict-avoidant, wants a script for spouse",
    unlockedByDefault: false,
    objectionDifficulty: "advanced",
    avatarTone: "neutral",
    initialGreeting: "Hey — I grabbed a quiet room. So… yeah, let's talk.",
  },
  {
    id: "think-about-it-kim",
    displayName: "Kim Alvarez",
    firstName: "Kim",
    age: 35,
    nicheGoal: "General fat loss",
    backgroundStory:
      "Classic 'I need to think about it' — uses delay as safety. Often interested but avoids commitment.",
    painPoints: ["Decision fatigue", "Fear of wrong choice"],
    buyingResistance: ["Commitment anxiety"],
    likelyObjections: [
      "I need to think about it",
      "I'm interested but not right now",
      "Can you follow up next week?",
    ],
    emotionalTriggers: ["Safety", "Small next steps", "No pressure"],
    budgetSensitivity: "medium",
    urgencyLevel: "low",
    trustLevel: "medium",
    personalityType: "Pleasant, vague, stalls",
    unlockedByDefault: true,
    objectionDifficulty: "intermediate",
    avatarTone: "warm",
    initialGreeting: "Hi! Thanks for hopping on — I'm still figuring out what I need.",
  },
  {
    id: "diy-sam",
    displayName: "Sam Okonkwo",
    firstName: "Sam",
    age: 30,
    nicheGoal: "Athletic performance",
    backgroundStory:
      "Believes they can DIY with free content. Secretly stuck. Pride blocks asking for help.",
    painPoints: ["Stalled progress", "Information overload"],
    buyingResistance: ["Identity: 'I should know this'"],
    likelyObjections: [
      "I can do it on my own",
      "I just need a meal plan PDF",
      "Your price is too high for accountability",
    ],
    emotionalTriggers: ["Competence respect", "Efficiency", "Ego-safe framing"],
    budgetSensitivity: "medium",
    urgencyLevel: "low",
    trustLevel: "low",
    personalityType: "Proud, debates you politely",
    unlockedByDefault: true,
    objectionDifficulty: "advanced",
    avatarTone: "cool",
    initialGreeting: "Hey. So — I'm pretty self-sufficient, but I'm curious what you do differently.",
  },
];

export function getPersonaById(id: string | undefined): Persona {
  const found = PERSONAS.find((p) => p.id === id);
  return found ?? PERSONAS[0];
}

export function getAvailablePersonas(unlockedIds: string[]): Persona[] {
  return PERSONAS.filter((p) => p.unlockedByDefault || unlockedIds.includes(p.id));
}
