import type { SectionDef } from "@/lib/content/types";

/**
 * The shape of their days and week. Canonical merge of `typicalDay`
 * (special-needs) and `typicalWeek` (general): one stored field per question,
 * with the wording adapting to the configuration. The structured `routines`
 * and `foods` sections shadow the prose here for the cards.
 */
export const routine: SectionDef = {
  slug: "typical-days",
  key: "routine",
  title: "A typical day",
  navTitle: "A typical day",
  intro:
    "Routine is safety. The more a new caregiver can keep {name}'s days familiar, " +
    "the easier every hard thing becomes. Describe what a day actually looks like: " +
    "not the ideal version, the real one.",
  variants: [
    {
      when: { supportLevel: ["mostlyIndependent"] },
      title: "A typical week",
      navTitle: "A typical week",
      intro:
        "A week has a shape, and most of {name}'s is invisible until someone else " +
        "has to hold it. The standing call on Sunday. The Tuesday appointment. The " +
        "order a morning has to happen in. Write the week as it actually runs, not " +
        "the tidy version.",
    },
  ],
  fields: [
    {
      id: "mornings",
      kind: "textarea",
      rows: 4,
      label: "Morning routine",
      placeholder:
        "Wake time, how they like to be woken, bathroom, meds, breakfast, getting dressed, in the order it happens",
      // Trimmed to the Daily Routine card's budget: the order is what a
      // stranger needs, so the example keeps the sequence and drops the aside.
      example:
        "Wakes at 6:30 on his own — don't rush him. Ten minutes under the covers " +
        "with the radio first. Meds in the blue cup with juice, never water. Two " +
        "waffles cut in strips, syrup on the side.",
      cardLengthHint: 240,
      variants: [
        {
          when: { supportLevel: ["mostlyIndependent"] },
          label: "How a morning goes",
          placeholder:
            "Wake time, medications, breakfast, the paper, what happens before anything else can",
          example:
            "Up at six whether anyone likes it or not. Coffee first (half a cup, milk, " +
            "no sugar), then the pills in the blue box on the counter, then the paper. " +
            "Do not try to talk to him about anything real before the paper.",
        },
      ],
    },
    {
      id: "evenings",
      kind: "textarea",
      rows: 4,
      label: "Evening and bedtime routine",
      placeholder: "Dinner, wind-down, bath or shower, the bedtime steps, what helps them settle",
      example:
        "Dinner at 6. Shower at 8:30 or not at all — towel on the left hook. Lights " +
        "out at 10 with the fan on; it is the sound, not the air.",
      cardLengthHint: 240,
      variants: [
        {
          when: { supportLevel: ["mostlyIndependent"] },
          label: "How an evening goes",
          placeholder: "Dinner, television, calls, the wind-down, bedtime and what helps sleep",
          // Its own example, per the rule in content/types.ts: the base one is
          // a supported adult's bedtime sequence, and a daughter writing about
          // her mother should not be shown that under this label.
          example:
            "Dinner at 5:30, news at six. She calls my sister most nights. Pills at " +
            "eight with the tea, then the crossword. Lights out by half nine.",
        },
      ],
    },
    {
      id: "sleep",
      kind: "textarea",
      rows: 3,
      label: "Sleep",
      placeholder:
        "Usual hours, what wakes them, what helps them fall back asleep, anything about how their room is set up",
      example:
        "Asleep by 10:30, up once around 2. The fan stays on all night. If he is up, " +
        "the bus timetable settles him faster than talking does.",
      cardLengthHint: 200,
    },
    {
      id: "food",
      kind: "textarea",
      rows: 4,
      label: "Food: favorites, dislikes, and rules",
      help: "Include textures, brands, how food is prepared and served, and anything they will not eat. Note any swallowing or choking concerns here too.",
      variants: [
        {
          when: { supportLevel: ["mostlyIndependent"] },
          label: "Food, appetite, and mealtimes",
          help: "What they eat, what they will not, who cooks, and anything about swallowing, dentures, or appetite that a new helper needs to know.",
        },
      ],
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
      cardLengthHint: 220,
    },
    {
      id: "gettingAround",
      kind: "textarea",
      rows: 4,
      label: "Getting around",
      help: "Driving, and how that is going. Who drives them otherwise. Stairs, walkers, canes, the parking situation.",
      showWhen: [{ stage: ["adult"] }],
    },
    {
      id: "clothing",
      kind: "textarea",
      rows: 3,
      label: "Clothing preferences",
      placeholder: "Fabrics, tags, seams, favorite items, anything they refuse to wear",
      showWhen: [
        { supportLevel: ["substantial", "roundTheClock"] },
        { communicationDiffers: ["yes"] },
      ],
    },
    {
      id: "sensory",
      kind: "textarea",
      rows: 4,
      label: "Sensory sensitivities",
      help: "Sounds, lights, textures, smells, crowds, touch. What overwhelms, and what soothes?",
      showWhen: [
        { communicationDiffers: ["yes"] },
        { behaviorEscalates: ["yes"] },
        { supportLevel: ["substantial", "roundTheClock"] },
      ],
    },
    {
      id: "comfortObjects",
      kind: "textarea",
      rows: 3,
      label: "Comfort objects and favorites",
      placeholder: "The things that must never be lost, and where the backups live",
      showWhen: [
        { supportLevel: ["substantial", "roundTheClock"] },
        { stage: ["child"] },
      ],
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
      openers: ["A good day usually starts with…", "You can tell it was a good day when…"],
      variants: [
        {
          when: { supportLevel: ["mostlyIndependent"] },
          label: "What a good day looks like",
          help: "How would someone else know it was one?",
          example:
            "A good day has the garden in it. She is out there by nine, back in for " +
            "the crossword after lunch, and calls me about both. If she mentions " +
            "what she is planting next spring, it was a very good day.",
        },
      ],
    },
    {
      id: "hardDay",
      kind: "textarea",
      rows: 4,
      label: "Describe a hard day",
      help: "What tends to go wrong? What does the day look like when it does? What helps salvage it?",
      openers: ["On a hard day, they…", "What usually helps is…"],
      variants: [
        {
          when: { supportLevel: ["mostlyIndependent"] },
          label: "What a hard day needs",
          help: "What tends to go wrong, and what actually helps when it does.",
        },
      ],
    },
  ],
};
