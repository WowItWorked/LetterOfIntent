import type { SectionDef } from "@/lib/content/types";

export const about: SectionDef = {
  slug: "about",
  key: "about",
  number: 2,
  title: "About {name}",
  navTitle: "About {name}",
  minutes: 10,
  intro:
    "Start with who they are — not the paperwork version, the person. The facts " +
    "help a future caregiver get things right. The stories help them actually " +
    "know {name}.",
  fields: [
    {
      id: "dateOfBirth",
      kind: "date",
      label: "Date of birth",
    },
    {
      id: "diagnoses",
      kind: "textarea",
      rows: 3,
      label: "Diagnoses and conditions",
      help: "Plain words are fine. List what a new doctor or caregiver should know first. This also prints on the emergency sheet.",
      placeholder: "e.g., Autism spectrum disorder; epilepsy (focal seizures); anxiety",
    },
    {
      id: "lifeHistory",
      kind: "textarea",
      rows: 8,
      label: "Their life so far, in your own words",
      help: "A short history: where they were born, the big chapters, moves, milestones, the people and places that shaped them. Write it the way you would tell it.",
      example:
        "Alex was born in Fairfax in 2004, two months early and stubborn from day one. " +
        "He was diagnosed with autism at three. Elementary school was rough until we " +
        "found Ms. Reyes, who figured out he learns everything through music. He has " +
        "lived at home with us all his life, except one summer camp in 2019 that he " +
        "still talks about. He knows the entire Metro map by heart and has never lost " +
        "at Uno without demanding a rematch.",
    },
    {
      id: "firstFiveMinutes",
      kind: "textarea",
      rows: 5,
      label: "What should a stranger know in the first five minutes?",
      help: "Imagine a kind stranger meeting {name} for the first time. What would make those minutes go well?",
      example:
        "Lead with his name — he warms up fast if you say \"Hi Alex\" before anything " +
        "else. Don't offer a handshake; a wave is better. If he asks your birthday, " +
        "tell him. He'll remember it forever, and it means he likes you.",
    },
    {
      id: "importantToKnow",
      kind: "textarea",
      rows: 4,
      label: "Anything else that makes them who they are",
      help: "Habits, quirks, talents, history — whatever didn't fit above but matters.",
    },
  ],
};
