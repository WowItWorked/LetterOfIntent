import type { SectionDef } from "@/lib/content/types";

/**
 * The portrait section: who this person is, before any paperwork. Canonical
 * merge of the old `about` (special-needs) and `aboutThem` (general) sections;
 * the accounting lives in docs/schema-migration.md. Conditions and diagnoses
 * moved to `health`, where they always belonged.
 */
export const person: SectionDef = {
  slug: "about-them",
  key: "person",
  title: "About {name}",
  navTitle: "About {name}",
  photoSlot: true,
  intro:
    "Start with who they are: not the paperwork version, the person. The facts " +
    "help a future caregiver get things right. The stories help them actually " +
    "know {name}. It is the difference between being managed and being known.",
  fields: [
    {
      id: "dateOfBirth",
      kind: "date",
      label: "Date of birth",
      help: "Useful on forms, at appointments, and on the emergency sheet.",
    },
    {
      id: "whoTheyAre",
      kind: "textarea",
      rows: 4,
      label: "Who they are, in your words",
      help: "If you had two minutes to introduce them to someone who will be helping, what would you say?",
      example:
        "Dad is 81, a retired high school principal, and still the most organized " +
        "person in any room. He reads two newspapers a day and has opinions about " +
        "both. He is funny in a dry way that people sometimes miss.",
      variants: [
        {
          when: { stage: ["child"] },
          example:
            "Alex is seventeen, funny, and stubborn in the best way. He knows the " +
            "entire Metro map by heart and has never lost at Uno without demanding " +
            "a rematch. If you earn his trust, you have it absolutely.",
        },
      ],
    },
    {
      id: "history",
      kind: "textarea",
      rows: 6,
      label: "The history that shaped them",
      help: "Where they were born, the big chapters, moves, milestones, the people and places that made them who they are. Write it the way you would tell it.",
      example:
        "Dad grew up on the farm in Carroll County and never really left it behind: " +
        "he still plants tomatoes every May. Thirty-one years at the high school, " +
        "the last twelve as principal. He lost Mom in 2019 and it rearranged him. " +
        "The garden and the Sunday calls with my sister are what held.",
      variants: [
        {
          when: { stage: ["child"] },
          label: "Their life so far, in your own words",
          example:
            "Alex was born in Fairfax in 2004, two months early and stubborn from " +
            "day one. He was diagnosed with autism at three. Elementary school was " +
            "rough until we found Ms. Reyes, who figured out he learns everything " +
            "through music. He has lived at home with us all his life, except one " +
            "summer camp in 2019 that he still talks about.",
        },
      ],
    },
    {
      id: "temperament",
      kind: "textarea",
      rows: 4,
      label: "Temperament, humor, and pride",
      help: "How do they handle being helped? What do they take pride in doing themselves?",
      example:
        "She will accept a ride but not an arm. Offering to carry her bag is fine; " +
        "taking it out of her hand is not. She would rather be ten minutes late than " +
        "be hurried.",
    },
    {
      id: "firstFiveMinutes",
      kind: "textarea",
      rows: 5,
      label: "What should a stranger know in the first five minutes?",
      help: "Imagine a kind stranger meeting {name} for the first time. What would make those minutes go well?",
      example:
        "Lead with his name. He warms up fast if you say \"Hi Alex\" before anything " +
        "else. Don't offer a handshake; a wave is better. If he asks your birthday, " +
        "tell him. He'll remember it forever, and it means he likes you.",
      variants: [
        {
          when: { supportLevel: ["mostlyIndependent"] },
          example:
            "Introduce yourself and say why you are there; she has no patience for " +
            "small talk with strangers. Take the coffee she offers even if you " +
            "don't drink it. Compliment the garden, honestly. Do not touch the " +
            "thermostat.",
        },
      ],
    },
    {
      id: "strangersGetWrong",
      kind: "textarea",
      rows: 3,
      label: "What strangers most often get wrong about them",
      example:
        "People hear the hearing aids and start shouting. He hears fine if you face " +
        "him and speak normally. Shouting makes it worse and embarrasses him.",
      variants: [
        {
          when: { communicationDiffers: ["yes"] },
          example:
            "People assume he doesn't understand because he doesn't answer. He " +
            "understands everything. He is deciding whether you are worth " +
            "answering.",
        },
      ],
    },
    {
      id: "cannotAbide",
      kind: "textarea",
      rows: 3,
      label: "What they cannot abide",
      help: "Being talked about in the third person, being rushed, baby talk, the television at that volume. Say it plainly. It saves everyone a bad first week.",
    },
    {
      id: "importantToKnow",
      kind: "textarea",
      rows: 4,
      label: "Anything else that makes them who they are",
      help: "Habits, quirks, talents, history: whatever didn't fit above but matters.",
    },
  ],
};
