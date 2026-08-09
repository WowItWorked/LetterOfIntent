import type { SectionDef } from "@/lib/content/types";

export const homeLiving: SectionDef = {
  slug: "home-and-daily-living",
  key: "homeLiving",
  number: 7,
  title: "Home and daily living",
  navTitle: "Home & daily living",
  minutes: 10,
  intro:
    "The house is half the care. Whoever steps in will inherit its quirks — the " +
    "door that sticks, the boiler that needs bleeding every autumn, the fact that " +
    "the laundry has quietly become someone else's job. Write down what you have " +
    "been holding up.",
  fields: [
    {
      id: "theHome",
      kind: "textarea",
      rows: 4,
      label: "The home itself",
      help: "Owned or rented, who the landlord or the mortgage is with, and what a newcomer needs to know to keep it running.",
      placeholder: "Where the water shut-off is, which key is which, the alarm code holder, the quirks",
    },
    {
      id: "deferred",
      kind: "textarea",
      rows: 3,
      label: "What is deferred, and what is urgent",
      help: "The repairs that have been put off, and the one or two that really cannot be.",
    },
    {
      id: "householdHelp",
      kind: "textarea",
      rows: 4,
      label: "Help with cooking, cleaning, laundry, and shopping",
      help: "Who does what today — including the parts you quietly do without being asked.",
      example:
        "She thinks she still does her own laundry. I do it on Saturdays while she " +
        "naps. She cooks breakfast and lunch; I leave dinners in the freezer labelled " +
        "by day.",
    },
    {
      id: "personalCare",
      kind: "textarea",
      rows: 4,
      label: "Personal care",
      help: "Bathing, dressing, hair, nails, teeth. What they manage, where help is needed, and how to offer it without a fight.",
    },
    {
      id: "petsAndPlants",
      kind: "textarea",
      rows: 3,
      label: "Pets, plants, and the things that depend on them",
      help: "Feeding, walks, the vet, and who would take them if it came to that.",
    },
    {
      id: "safety",
      kind: "textarea",
      rows: 4,
      label: "Safety around the house",
      help: "Stairs, the stove, the bath, night-time wandering, falls that have already happened. Also what is already in place: grab bars, an alert pendant, a neighbor who checks.",
    },
  ],
};
