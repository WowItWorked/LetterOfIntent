import type { SectionDef } from "@/lib/content/types";

export const typicalDay: SectionDef = {
  slug: "a-typical-day",
  key: "typicalDay",
  number: 4,
  title: "A typical day",
  navTitle: "A typical day",
  minutes: 15,
  intro:
    "Routine is safety. The more a new caregiver can keep {name}'s days familiar, " +
    "the easier every hard thing becomes. Describe what a day actually looks like — " +
    "not the ideal version, the real one.",
  fields: [
    {
      id: "morningRoutine",
      kind: "textarea",
      rows: 4,
      label: "Morning routine",
      placeholder:
        "Wake time, how they like to be woken, bathroom, meds, breakfast, getting dressed — in the order it happens",
      example:
        "Alex wakes at 6:30 on his own. Don't rush him — he needs ten minutes under " +
        "the covers listening to the radio before anything else. Meds go in the blue " +
        "cup with orange juice, never water. Breakfast is the same every day: two " +
        "waffles cut in strips, syrup on the side.",
    },
    {
      id: "eveningRoutine",
      kind: "textarea",
      rows: 4,
      label: "Evening and bedtime routine",
      placeholder: "Dinner, wind-down, bath or shower, the bedtime steps, what helps them settle",
    },
    {
      id: "sleep",
      kind: "textarea",
      rows: 3,
      label: "Sleep",
      placeholder:
        "Usual hours, what wakes them, what helps them fall back asleep, anything about how their room is set up",
    },
    {
      id: "food",
      kind: "textarea",
      rows: 4,
      label: "Food — favorites, dislikes, and rules",
      help: "Include textures, brands, how food is prepared and served, and anything they will not eat. Note any swallowing or choking concerns here too.",
    },
    {
      id: "clothing",
      kind: "textarea",
      rows: 3,
      label: "Clothing preferences",
      placeholder: "Fabrics, tags, seams, favorite items, anything they refuse to wear",
    },
    {
      id: "sensory",
      kind: "textarea",
      rows: 4,
      label: "Sensory sensitivities",
      help: "Sounds, lights, textures, smells, crowds, touch. What overwhelms — and what soothes?",
    },
    {
      id: "comfortObjects",
      kind: "textarea",
      rows: 3,
      label: "Comfort objects and favorites",
      placeholder: "The things that must never be lost — and where the backups live",
    },
    {
      id: "goodDay",
      kind: "textarea",
      rows: 4,
      label: "Describe a good day",
      help: "What happened, in order? What made it good? How can you tell it was one?",
      example:
        "A good day starts with no surprises. Program from 9 to 2, chicken nuggets " +
        "after, then an hour of train videos. If the day went well, he hums at dinner. " +
        "The hum is how we know.",
    },
    {
      id: "hardDay",
      kind: "textarea",
      rows: 4,
      label: "Describe a hard day",
      help: "What tends to go wrong? What does the day look like when it does? What helps salvage it?",
    },
  ],
};
