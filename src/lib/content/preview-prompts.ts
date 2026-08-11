/**
 * The three "Be ready to write about" lines shown when a section row on the
 * question preview is opened. Keyed by canonical section slug — one entry per
 * section in the one roster.
 *
 * `preview-prompts.test.ts` fails if a section ever exists without an entry.
 */
export const previewPrompts: Record<string, [string, string, string]> = {
  "getting-started": [
    "Full legal name, the name everyone actually uses, date of birth",
    "Who you are, and your relationship to them",
    "The one thing you want whoever reads this to read first",
  ],
  "about-them": [
    "Who they are, and the history that shaped them",
    "Temperament, humor, pride, and what they cannot abide",
    "What strangers most often get wrong about them",
  ],
  "family-and-support": [
    "Everyone who helps today, and what each person does",
    "Who to call first, and anyone who should not be called",
    "Paid supports: aides, case managers, cleaners, respite",
  ],
  "typical-days": [
    "Mornings, evenings, and the order a day happens in",
    "The fixed points of the week, sleep, and mealtimes",
    "What a good day looks like, and what a hard one needs",
  ],
  communication: [
    "How they communicate, and how they prefer to be spoken to",
    'What "yes" and "no" actually look like from them',
    "Signs of pain or trouble they will not say out loud",
  ],
  "health-and-medical": [
    "Conditions, medications, doses, and allergies",
    "Doctors, pharmacy, and the preferred hospital",
    "Where records, cards, and directives are kept (never the numbers)",
  ],
  "behavioral-support": [
    "Known triggers, and the earliest warning signs",
    "Step-by-step de-escalation that actually works",
    "Guidance for police and first responders",
  ],
  allergies: [
    "Each allergy, and what the reaction looks like",
    "How serious each one is: life-threatening, serious, or mild",
    "What to do when it happens",
  ],
  "emergency-plan": [
    "The steps to take, in order",
    "When to call 911, and who to call otherwise",
    "The rule on over-the-counter medicine",
  ],
  "daily-routines": [
    "Each block of the day as steps: waking, meals, bedtime",
    "Rough times, and the order things happen in",
    "How to move between activities without a fight",
  ],
  "food-and-eating": [
    "Foods that always work, and foods they will not eat",
    "Texture rules and choking risks",
    "The mealtime help that keeps things calm",
  ],
  "personal-care": [
    "Toileting, dressing, bathing, and getting around",
    "The steps for each, written for a first-timer",
    "The equipment involved, and where it lives",
  ],
  "home-and-daily-living": [
    "Where they live now, and what makes it work",
    "The help you quietly provide, and safety around the house",
    "What the next living situation should look like, and the limits",
  ],
  "school-and-work": [
    "School, day program, work, or volunteering, and key people",
    "What has worked, and commitments others depend on",
    "Hopes for meaningful, proud days",
  ],
  "money-and-benefits": [
    "Benefits and programs, and how the bills actually get paid",
    "The trust, the trustee, and anything pending",
    "Where the documents are kept (never the numbers themselves)",
  ],
  "legal-and-decisions": [
    "Powers of attorney, advance directives, and any guardianship",
    "Who decides what, and where the limits are",
    "Advocates, attorneys, and fights already fought",
  ],
  "friends-joy-and-faith": [
    "What they love, and what a good day includes",
    "Faith community, traditions, and holidays",
    "Friendships worth protecting",
  ],
  "guidance-for-the-trustee": [
    "What you would spend money on, and what you would not",
    "How to decide when your loved one and the trustee disagree",
    "Who to consult before any large decision",
  ],
  "for-whoever-steps-in": [
    "What the first week should look like",
    "Decisions you would make differently, in hindsight",
    "Who to consult before anything irreversible",
  ],
  "final-wishes": [
    "Funeral, burial or cremation, faith observances",
    "Who should be told, and in what order",
    "What you want said about them",
  ],
  "a-personal-message": [
    "What you would say if you could be in the room",
    "What you hope for them",
    "Words for the person taking over",
  ],
};
