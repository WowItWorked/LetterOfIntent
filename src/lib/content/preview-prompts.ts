/**
 * The three "Be ready to write about" lines shown when a row on the chooser is
 * opened. Keyed by section slug, so a section that both paths share shows the
 * same preview in both.
 *
 * `preview-prompts.test.ts` fails if a section ever exists without an entry.
 */
export const previewPrompts: Record<string, [string, string, string]> = {
  /* ------------------------------------------------------- shared sections */
  "getting-started": [
    "Full legal name, the name everyone actually uses, date of birth",
    "Who you are, and your relationship to them",
    "The one thing you want whoever reads this to read first",
  ],
  "family-and-support": [
    "Everyone who helps today, and what each person does",
    "Who to call first, and anyone who should not be called",
    "Paid supports: aides, case managers, cleaners, respite",
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

  /* ------------------------------------------------- special needs sections */
  about: [
    "Diagnoses, and roughly when each was made",
    "What they are like: humor, temperament, what they are proud of",
    "What strangers most often get wrong about them",
  ],
  "a-typical-day": [
    "Morning, afternoon, and evening in the order they happen",
    "What they do independently, and where help is needed",
    "Foods, textures, and mealtime habits",
  ],
  communication: [
    "How they communicate, and any device or signs they use",
    'What "yes" and "no" actually look like from them',
    "Signs of pain or illness they will not say out loud",
  ],
  medical: [
    "Allergies, and every current medication with its dose and timing",
    "Doctors, specialists, therapists, and the preferred hospital",
    "Where insurance cards and records are kept",
  ],
  "behavioral-support": [
    "Known triggers, and the earliest warning signs",
    "Step-by-step de-escalation that actually works",
    "Guidance for police and first responders",
  ],
  "school-and-work": [
    "Current program, IEP or transition plan, and key staff",
    "What has worked, and what has already failed",
    "Hopes for work, volunteering, or a day program",
  ],
  housing: [
    "Where they live now, and what makes it work",
    "What the next living situation should look like",
    "Housemates, staffing, and the non-negotiables",
  ],
  "benefits-and-finances": [
    "SSI, Medicaid, and waivers they receive today",
    "The trust, the trustee, and how funds should be used",
    "Where the documents are kept (never the numbers themselves)",
  ],
  "friends-joy-and-faith": [
    "What they love, and what a good day includes",
    "Faith community, traditions, and holidays",
    "Friendships worth protecting",
  ],
  "legal-and-advocacy": [
    "Guardianship, powers of attorney, supported decision-making",
    "Attorneys, advocates, and who holds the documents",
    "Fights already fought, so no one repeats them",
  ],
  "guidance-for-the-trustee": [
    "What you would spend money on, and what you would not",
    "How to decide when your loved one and the trustee disagree",
    "Who to consult before any large decision",
  ],

  /* ------------------------------------------------------ general sections */
  "about-them": [
    "Who they are, and the history that shaped them",
    "Temperament, humor, pride, and what they cannot abide",
    "What strangers get wrong about them",
  ],
  "a-typical-week": [
    "Mornings, evenings, and how a day is ordered",
    "The fixed points of the week: appointments, church, the standing call",
    "What a good day looks like, and what a hard one needs",
  ],
  "talking-with-them": [
    "How they prefer to be spoken to, and by whom",
    "Hearing, vision, and memory as they are now",
    "What they will not admit to needing",
  ],
  "health-and-medical": [
    "Conditions, medications, doses, and allergies",
    "Doctors, pharmacy, and the preferred hospital",
    "Where records, cards, and directives are kept",
  ],
  "home-and-daily-living": [
    "The house itself, what it needs and what is deferred",
    "Help with cooking, cleaning, laundry, bathing",
    "Pets, plants, and who cares for them",
  ],
  "money-and-documents": [
    "Who handles bills today, and how they are paid",
    "Where documents are kept (never the numbers themselves)",
    "Scams or pressure they are vulnerable to",
  ],
  "work-and-obligations": [
    "A job, a business, a board, or volunteering",
    "Commitments other people are depending on",
    "What should be wound down, and by whom",
  ],
  "faith-joy-and-community": [
    "Faith, congregation, and observances that matter",
    "Friends and neighbors who should be kept close",
    "What still brings genuine pleasure",
  ],
  "legal-and-decisions": [
    "Powers of attorney, advance directives, and any guardianship",
    "Who decides what, and where the limits are",
    "Attorney, accountant, and advisor contacts",
  ],
  "for-whoever-steps-in": [
    "What the first week should look like",
    "Decisions you would make differently, in hindsight",
    "Who to consult before anything irreversible",
  ],
};
