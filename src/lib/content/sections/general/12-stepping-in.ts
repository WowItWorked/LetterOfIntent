import type { SectionDef } from "@/lib/content/types";

export const steppingIn: SectionDef = {
  slug: "for-whoever-steps-in",
  key: "steppingIn",
  number: 12,
  title: "For whoever steps in",
  navTitle: "For whoever steps in",
  minutes: 10,
  intro:
    "Write this part to a person. It might be a sibling, a son or daughter, a " +
    "neighbor, or someone none of you have met yet. They will be reading it on a " +
    "bad day, and everything you say here will save them a week of guessing.",
  fields: [
    {
      id: "firstWeek",
      kind: "textarea",
      rows: 5,
      label: "What the first week should look like",
      help: "In order. What to do on day one, who to call, and what can safely wait a fortnight.",
      example:
        "Call Dr. Patel's office and say you are taking over — they will send the " +
        "medication list. Then the neighbor Ellen, who has a key and has been " +
        "checking. Do not cancel the cleaning service, it is the only visitor she " +
        "looks forward to. Everything financial can wait two weeks.",
    },
    {
      id: "hindsight",
      kind: "textarea",
      rows: 4,
      label: "What you would do differently, in hindsight",
      help: "The thing you wish you had done sooner, and the thing you wish you had not done at all. This is the most valuable paragraph in the letter.",
    },
    {
      id: "neverChange",
      kind: "textarea",
      rows: 4,
      label: "What you would ask never to be changed",
      help: "The arrangements that look inefficient and are not. Say why — a reason survives a change of caregiver; a rule does not.",
      example:
        "Do not move her to a bedroom downstairs, however sensible it looks. The " +
        "stairs are the only exercise she gets and the room upstairs is the one she " +
        "shared with Dad.",
    },
    {
      id: "consultFirst",
      kind: "textarea",
      rows: 3,
      label: "Who to consult before anything irreversible",
      help: "Selling the house, ending a lease, a move, a major medical decision. Who should be in that conversation?",
    },
  ],
};
