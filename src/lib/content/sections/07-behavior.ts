import type { SectionDef } from "@/lib/content/types";

export const behavior: SectionDef = {
  slug: "behavioral-support",
  key: "behavior",
  number: 7,
  title: "Behavioral support",
  navTitle: "Behavior support",
  minutes: 15,
  intro:
    "This may be the hardest section to write. It is also the one a future " +
    "caregiver will reach for on the worst day.\n\n" +
    "Honest notes here — what sets things off, what helps, what makes it worse — " +
    "keep {name} safe with people who don't know them yet. You are not betraying " +
    "{name} by writing this. You are handing someone the manual you had to learn " +
    "the hard way. Short phrases are fine. Take your time.",
  fields: [
    {
      id: "triggers",
      kind: "textarea",
      rows: 4,
      label: "Known triggers",
      help: "Situations, sounds, changes, sensations, words. Specific beats general — \"schedule changes he wasn't warned about\" helps more than \"stress.\"",
      example:
        "Fire alarms and any sudden loud noise. Being told \"no\" without an " +
        "alternative. Plans changing without warning. The word \"later\" — give him " +
        "a real time instead.",
    },
    {
      id: "earlyWarnings",
      kind: "textarea",
      rows: 3,
      label: "Early warning signs",
      help: "What do the first two minutes look like, before things escalate? What would a stranger miss?",
    },
    {
      id: "deEscalation",
      kind: "textarea",
      rows: 5,
      label: "What helps most when things escalate",
      help: "Step by step if you can: what to do first, what to say, what space or object helps, and how long it usually takes.",
      example:
        "Lower your voice — never match his volume. One person talks; everyone else " +
        "steps back. Offer the weighted blanket and his headphones. Say \"You're " +
        "safe. I'm here. We can wait.\" Then actually wait — it takes about ten " +
        "minutes. Don't discuss what happened until at least an hour after.",
    },
    {
      id: "makesWorse",
      kind: "textarea",
      rows: 3,
      label: "What makes things worse",
      help: "The things a well-meaning stranger might try that backfire — touch, crowding, raised voices, rapid questions, blocking the doorway.",
    },
    {
      id: "crisisPlan",
      kind: "textarea",
      rows: 4,
      label: "If there's a full crisis, what should happen — step by step",
      help: "Who gets called, in what order? Is there a crisis line, a behavior plan on file, a hospital to prefer or avoid? What has actually ended a crisis before?",
    },
    {
      id: "lawEnforcement",
      kind: "textarea",
      rows: 5,
      label: "Guidance for police and first responders",
      help: "How {name} may react to uniforms, sirens, flashing lights, loud commands, or being touched — and what an officer should do instead. If you've registered with your local police department's voluntary disability registry, say so here.",
      example:
        "Jordan may not respond to verbal commands and may run — that is fear, not " +
        "defiance. He cannot answer \"What's your name?\" under stress. Please don't " +
        "touch or restrain him unless lives depend on it; he will fight a hold, and " +
        "he does not understand handcuffs. One officer, slow voice, lights and " +
        "sirens off. Ask \"Where is your card?\" — he carries an autism ID card in " +
        "his left pocket.",
    },
  ],
};
