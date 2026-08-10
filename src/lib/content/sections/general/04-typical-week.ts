import type { SectionDef } from "@/lib/content/types";

export const typicalWeek: SectionDef = {
  slug: "a-typical-week",
  key: "typicalWeek",
  number: 4,
  title: "A typical week",
  navTitle: "A typical week",
  minutes: 15,
  intro:
    "A week has a shape, and most of {name}'s is invisible until someone else has " +
    "to hold it. The standing call on Sunday. The Tuesday appointment. The order a " +
    "morning has to happen in. Write the week as it actually runs, not the tidy " +
    "version.",
  fields: [
    {
      id: "mornings",
      kind: "textarea",
      rows: 4,
      label: "How a morning goes",
      placeholder:
        "Wake time, medications, breakfast, the paper, what happens before anything else can",
      example:
        "Up at six whether anyone likes it or not. Coffee first (half a cup, milk, " +
        "no sugar), then the pills in the blue box on the counter, then the paper. " +
        "Do not try to talk to him about anything real before the paper.",
    },
    {
      id: "evenings",
      kind: "textarea",
      rows: 4,
      label: "How an evening goes",
      placeholder: "Dinner, television, calls, the wind-down, bedtime and what helps sleep",
    },
    {
      id: "fixedPoints",
      kind: "textarea",
      rows: 5,
      label: "The fixed points of the week",
      help: "Appointments, church, the standing phone call, the card game, the day the aide comes. Include the day and roughly the time.",
      example:
        "Monday: aide comes 9–1. Wednesday: cardiology every third month. Thursday: " +
        "grocery run, always Giant, always the same list. Sunday: my sister calls at " +
        "4pm and he waits by the phone from 3:45.",
    },
    {
      id: "gettingAround",
      kind: "textarea",
      rows: 4,
      label: "Getting around",
      help: "Driving, and how that is going. Who drives them otherwise. Stairs, walkers, canes, the parking situation.",
    },
    {
      id: "food",
      kind: "textarea",
      rows: 4,
      label: "Food, appetite, and mealtimes",
      help: "What they eat, what they will not, who cooks, and anything about swallowing, dentures, or appetite that a new helper needs to know.",
    },
    {
      id: "goodDay",
      kind: "textarea",
      rows: 3,
      label: "What a good day looks like",
      help: "How would someone else know it was one?",
    },
    {
      id: "hardDay",
      kind: "textarea",
      rows: 4,
      label: "What a hard day needs",
      help: "What tends to go wrong, and what actually helps when it does.",
    },
  ],
};
