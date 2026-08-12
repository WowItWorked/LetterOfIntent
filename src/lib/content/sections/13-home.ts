import type { SectionDef } from "@/lib/content/types";

/**
 * Canonical merge of `housing` (special-needs) and `homeLiving` (general).
 * currentLiving (the arrangement) and theHome (the house's operating manual)
 * stay separate fields: the old table paired them, and the pairing fails the
 * merge test. Same for hardLimits (future red lines) vs. safety (present
 * hazards).
 */
export const home: SectionDef = {
  slug: "home-and-daily-living",
  key: "home",
  title: "Home and daily living",
  navTitle: "Home & daily living",
  intro:
    "Where and how {name} lives may be the biggest decision anyone ever makes " +
    "for them, and the house itself is half the care. This section tells future " +
    "decision-makers what you know, what you have quietly been holding up, and " +
    "what you want.",
  fields: [
    {
      id: "currentLiving",
      kind: "textarea",
      rows: 3,
      label: "Current living situation",
      placeholder: "Where they live, with whom, and how it works day to day",
    },
    {
      id: "theHome",
      kind: "textarea",
      rows: 4,
      label: "The home itself",
      help: "Owned or rented, who the landlord or the mortgage is with, and what a newcomer needs to know to keep it running.",
      // Ungated. Was livesWith ∈ {ownHome, withOthers} — but "Current living
      // situation" directly above already asks where they live, so the
      // onboarding question was asking it a second time to hide this one.
      placeholder: "Where the water shut-off is, which key is which, the alarm code holder, the quirks",
    },
    {
      id: "supportLevel",
      kind: "textarea",
      rows: 4,
      label: "The support they need to live safely",
      help: "Be concrete: cooking, medications, money, hygiene, transportation, being alone. What can they do on their own? What needs a person nearby, or a person doing it?",
    },
    {
      id: "householdHelp",
      kind: "textarea",
      rows: 4,
      label: "Help with cooking, cleaning, laundry, and shopping",
      help: "Who does what today, including the parts you quietly do without being asked.",
      example:
        "She thinks she still does her own laundry. I do it on Saturdays while she " +
        "naps. She cooks breakfast and lunch; I leave dinners in the freezer labelled " +
        "by day.",
      showWhen: [{ supportLevel: ["mostlyIndependent", "someDailyHelp"] }],
    },
    {
      id: "personalCare",
      kind: "textarea",
      rows: 4,
      label: "Personal care",
      help: "Bathing, dressing, hair, nails, teeth. What they manage, where help is needed, and how to offer it without a fight.",
      example:
        "Showers alone but will not start without the checklist on the mirror. Needs " +
        "help with buttons and nails. Offer, never take over.",
      cardLengthHint: 200,
      showWhen: [{ supportLevel: ["someDailyHelp", "substantial", "roundTheClock"] }],
    },
    {
      id: "petsAndPlants",
      kind: "textarea",
      rows: 3,
      label: "Pets, plants, and the things that depend on them",
      help: "Feeding, walks, the vet, and who would take them if it came to that.",
    },
    {
      id: "deferred",
      kind: "textarea",
      rows: 3,
      label: "What is deferred, and what is urgent",
      // Ungated, with theHome above — same reasoning.
      help: "The repairs that have been put off, and the one or two that really cannot be.",
    },
    {
      id: "safety",
      kind: "textarea",
      rows: 4,
      label: "Safety around the house",
      help: "Stairs, the stove, the bath, night-time wandering, falls that have already happened. Also what is already in place: grab bars, an alert pendant, a neighbor who checks.",
      example:
        "Stairs on the left rail only. The stove knobs come off at night. Grab bars " +
        "in the bath; the neighbour checks at eight.",
      cardLengthHint: 200,
    },
    {
      id: "waiverStatus",
      kind: "textarea",
      rows: 3,
      label: "Waiver and waitlist status",
      help: "A Medicaid waiver pays for long-term support at home or in the community. In Virginia these are the DD waivers, and the waitlist runs years. Where is {name} on it? Who manages the paperwork and the yearly updates?",
      showWhen: [{ hasBenefits: ["yes", "maybe"] }],
    },
    {
      id: "futureHopes",
      kind: "textarea",
      rows: 4,
      label: "Your hopes for their future home",
      help: "Dream concretely: what kind of place, with what kind of people, near whom, with what support?",
    },
    {
      id: "hardLimits",
      kind: "textarea",
      rows: 3,
      label: "What kind of living situation would you not want for them?",
      help: "Say it plainly. Future decision-makers can't honor limits they never heard.",
      example:
        "Never a large institution. Not alone in an apartment with only drop-in " +
        "checks: he needs someone present overnight. And never far from his sister; " +
        "their Sunday dinners are the spine of his week.",
    },
  ],
};
