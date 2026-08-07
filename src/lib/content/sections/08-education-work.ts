import type { SectionDef } from "@/lib/content/types";

export const educationWork: SectionDef = {
  slug: "school-and-work",
  key: "educationWork",
  number: 8,
  title: "School, work, and meaningful days",
  navTitle: "School & work",
  minutes: 10,
  intro:
    "What fills {name}'s days now, what has worked before, and what you hope " +
    "their days hold in the future.",
  fields: [
    {
      id: "currentProgram",
      kind: "textarea",
      rows: 3,
      label: "Current school or day program",
      placeholder: "Name, contact person, schedule, and how transportation works",
    },
    {
      id: "iepHistory",
      kind: "textarea",
      rows: 4,
      label: "School and IEP history — what has worked",
      help: "An IEP (Individualized Education Program) is the written plan a school builds for a student with a disability. Which supports, settings, and people actually helped? What failed?",
    },
    {
      id: "whatWorksLearning",
      kind: "textarea",
      rows: 3,
      label: "How they learn best",
      placeholder: "e.g., Show, don't tell; one step at a time; visual schedules; repetition without frustration",
    },
    {
      id: "workHistory",
      kind: "textarea",
      rows: 3,
      label: "Work history",
      placeholder: "Jobs, volunteer roles, and the tasks they're proud of",
    },
    {
      id: "jobSupports",
      kind: "textarea",
      rows: 3,
      label: "Job coaches and employment supports",
      placeholder: "e.g., Supported employment through the county; coach's name and agency",
      help: "Supported employment means a coach helps someone find and keep a job. If {name} has one, name the program and the people.",
    },
    {
      id: "hopes",
      kind: "textarea",
      rows: 4,
      label: "Your hopes for meaningful activity",
      help: "What does a good working life look like for {name} — paid or not? What kind of work or activity makes them feel useful and proud?",
    },
  ],
};
