import type { SectionDef } from "@/lib/content/types";

/**
 * The old `steppingIn` section, canonical. Its consultFirst is deliberately a
 * different question from the trustee's: who a caregiver convenes before
 * anything irreversible, not who a trustee checks with about money.
 */
export const caregiverGuidance: SectionDef = {
  slug: "for-whoever-steps-in",
  key: "caregiverGuidance",
  title: "For whoever steps in",
  navTitle: "For whoever steps in",
  showWhen: [{ audience: ["caregiver", "both"] }],
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
        "Call Dr. Patel's office and say you are taking over. They will send the " +
        "medication list. Then the neighbor Ellen, who has a key and has been " +
        "checking. Do not cancel the cleaning service, it is the only visitor she " +
        "looks forward to. Everything financial can wait two weeks.",
      // The base is aging-voiced; the high-support pole gets the mirror, so
      // neither family reads the other's life as the model answer.
      variants: [
        {
          when: { supportLevel: ["substantial", "roundTheClock"] },
          example:
            "Keep his routine exactly as the daily-routines section says for the " +
            "first two weeks, even where it seems fussy. Call the day program on " +
            "day one so the faces he knows stay in his week. His aide Marcus " +
            "knows the hard moments better than anyone, keep him. Paperwork can " +
            "wait a fortnight.",
        },
      ],
      openers: ["On the first day…", "Before anything else, call…"],
    },
    {
      id: "hindsight",
      kind: "textarea",
      rows: 4,
      label: "What you would do differently, in hindsight",
      help: "The thing you wish you had done sooner, and the thing you wish you had not done at all. This is the most valuable paragraph in the letter.",
      openers: ["I wish I had started sooner on…", "If I could do one thing over…"],
    },
    {
      id: "neverChange",
      kind: "textarea",
      rows: 4,
      label: "What you would ask never to be changed",
      help: "The arrangements that look inefficient and are not. Say why: a reason survives a change of caregiver; a rule does not.",
      example:
        "Do not move her to a bedroom downstairs, however sensible it looks. The " +
        "stairs are the only exercise she gets and the room upstairs is the one she " +
        "shared with Dad.",
      variants: [
        {
          when: { supportLevel: ["substantial", "roundTheClock"] },
          example:
            "The hour alone in his room after program is not isolation, it is " +
            "how he recovers from the day. Taking it away to be sociable will " +
            "cost you the whole evening. It stays, wherever he lives.",
        },
      ],
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
