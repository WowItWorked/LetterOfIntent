import type { SectionDef } from "@/lib/content/types";

/**
 * Canonical merge of `educationWork` (special-needs) and `workObligations`
 * (general). School questions and work questions gate independently on the
 * schoolWork follow-up (a multi-select: transition-age adults can have both).
 */
export const schoolWork: SectionDef = {
  slug: "school-and-work",
  key: "schoolWork",
  title: "School, work, and meaningful days",
  navTitle: "School & work",
  optionalTag: true,
  showWhen: [{ schoolWork: ["school", "work"] }],
  intro:
    "What fills {name}'s days now, what has worked before, who is relying on " +
    "them, and what you hope their days hold in the future.",
  fields: [
    {
      id: "currentProgram",
      kind: "textarea",
      rows: 3,
      label: "Current school or day program",
      placeholder: "Name, contact person, schedule, and how transportation works",
      showWhen: [{ schoolWork: ["school"] }],
    },
    {
      id: "iepHistory",
      kind: "textarea",
      rows: 4,
      label: "School and IEP history: what has worked",
      help: "An IEP (Individualized Education Program) is the written plan a school builds for a student with a disability. Which supports, settings, and people actually helped? What failed?",
      showWhen: [{ schoolWork: ["school"] }],
    },
    {
      id: "whatWorksLearning",
      kind: "textarea",
      rows: 3,
      label: "How they learn best",
      placeholder: "e.g., Show, don't tell; one step at a time; visual schedules; repetition without frustration",
      showWhen: [{ schoolWork: ["school"] }],
    },
    {
      id: "workHistory",
      kind: "textarea",
      rows: 3,
      label: "Work history",
      placeholder: "Jobs, volunteer roles, and the tasks they're proud of",
      showWhen: [{ schoolWork: ["work"] }],
    },
    {
      id: "currentWork",
      kind: "textarea",
      rows: 4,
      label: "Work, business, or volunteering",
      help: "What they do, where, how often, and how much it matters to them.",
      placeholder: "e.g., Still keeps the books for the family business two days a week",
      showWhen: [{ schoolWork: ["work"] }],
    },
    {
      id: "jobSupports",
      kind: "textarea",
      rows: 3,
      label: "Job coaches and employment supports",
      placeholder: "e.g., Supported employment through the county; coach's name and agency",
      help: "Supported employment means a coach helps someone find and keep a job. If {name} has one, name the program and the people.",
      showWhen: [{ schoolWork: ["work"] }],
    },
    {
      id: "commitments",
      kind: "textarea",
      rows: 4,
      label: "Commitments other people are depending on",
      help: "Boards, committees, a congregation role, a standing volunteer shift, tenants, clients.",
      showWhen: [{ schoolWork: ["work"] }],
    },
    {
      id: "keyContacts",
      kind: "textarea",
      rows: 3,
      label: "Who to tell, and how to reach them",
      placeholder: "The business partner, the board chair, the property manager, the volunteer coordinator",
      showWhen: [{ schoolWork: ["work"] }],
    },
    {
      id: "windDown",
      kind: "textarea",
      rows: 4,
      label: "What should be wound down, and by whom",
      help: "What can simply stop, what has to be handed over carefully, and what they would want continued in their name.",
      example:
        "The bookkeeping can pass to Dana at the office (she has done it before). " +
        "The scholarship committee he would want kept going; call Marge, she knows " +
        "the whole history.",
      showWhen: [{ schoolWork: ["work"] }],
    },
    {
      id: "hopes",
      kind: "textarea",
      rows: 4,
      label: "Your hopes for meaningful activity",
      help: "What does a good working life look like for {name}, paid or not? What kind of work or activity makes them feel useful and proud?",
    },
  ],
};
