import type { SectionDef } from "@/lib/content/types";

export const aboutThem: SectionDef = {
  slug: "about-them",
  key: "aboutThem",
  number: 2,
  title: "About {name}",
  navTitle: "About {name}",
  minutes: 10,
  intro:
    "Whoever steps in will meet {name} as they are now. This is where you give " +
    "them the rest: the history that shaped this person, what they are proud of, " +
    "and what they will not tolerate. It is the difference between being managed " +
    "and being known.",
  photoSlot: true,
  fields: [
    {
      id: "dateOfBirth",
      kind: "date",
      label: "Date of birth",
      help: "Useful on forms and at appointments.",
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
    },
    {
      id: "history",
      kind: "textarea",
      rows: 4,
      label: "The history that shaped them",
      help: "Work, service, where they grew up, what they built, what they lost. The things they would want a stranger to know.",
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
      id: "cannotAbide",
      kind: "textarea",
      rows: 3,
      label: "What they cannot abide",
      help: "Being talked about in the third person, being rushed, baby talk, the television at that volume. Say it plainly. It saves everyone a bad first week.",
    },
    {
      id: "strangersGetWrong",
      kind: "textarea",
      rows: 3,
      label: "What strangers most often get wrong about them",
      example:
        "People hear the hearing aids and start shouting. He hears fine if you face " +
        "him and speak normally. Shouting makes it worse and embarrasses him.",
    },
  ],
};
