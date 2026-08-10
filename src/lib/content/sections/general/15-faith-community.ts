import type { SectionDef } from "@/lib/content/types";

export const faithCommunity: SectionDef = {
  slug: "faith-joy-and-community",
  key: "faithCommunity",
  number: 15,
  title: "Faith, joy, and community",
  navTitle: "Faith, joy & community",
  minutes: 10,
  intro:
    "Care that only covers the body is not care. This section is about the parts " +
    "of {name}'s life that make the rest worth keeping: the congregation, the " +
    "friends who would notice an absence, the pleasures that have survived " +
    "everything else.",
  fields: [
    {
      id: "faith",
      kind: "textarea",
      rows: 4,
      label: "Faith and observance",
      help: "What they believe and what they practice, including anything that must continue if they cannot ask for it.",
      example:
        "Communion at home on the first Sunday; Father Reilly already knows and will " +
        "come if called. Grace before dinner, always, even in a hospital.",
    },
    {
      id: "congregation",
      kind: "textarea",
      rows: 3,
      label: "Congregation, club, or group",
      placeholder: "Which one, who to call there, and whether they would want to be told",
    },
    {
      id: "friendsAndNeighbors",
      kind: "textarea",
      rows: 4,
      label: "Friends and neighbors who should be kept close",
      help: "The ones who check in, the ones who would want to know, and the ones who are the whole social calendar.",
    },
    {
      id: "traditions",
      kind: "textarea",
      rows: 4,
      label: "Traditions and holidays",
      help: "The ones that matter, how they are kept, and who hosts. These are the first things to quietly disappear when someone else takes over.",
    },
    {
      id: "pleasures",
      kind: "textarea",
      rows: 4,
      label: "What still brings genuine pleasure",
      help: "The garden, the crossword, the ballgame, the drive to the shore, the third cup of coffee. Small things count. They are usually the point.",
    },
  ],
};
