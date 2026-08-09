import type { SectionDef } from "@/lib/content/types";
import { gettingStarted } from "../01-getting-started";
import { familySupport } from "../03-family-support";
import { finalWishes } from "../14-final-wishes";
import { personalMessage } from "../15-personal-message";
import { aboutThem } from "./02-about-them";
import { typicalWeek } from "./04-typical-week";
import { dailyCommunication } from "./05-communication";
import { healthMedical } from "./06-health-medical";
import { homeLiving } from "./07-home-living";
import { moneyDocuments } from "./08-money-documents";
import { workObligations } from "./09-work-obligations";
import { faithCommunity } from "./10-faith-community";
import { legalDecisions } from "./11-legal-decisions";
import { steppingIn } from "./12-stepping-in";

/**
 * Four sections ask the same thing whichever letter you are writing, so both
 * paths share their definition — and their data. A family that starts one
 * letter and switches keeps the names, the people, and the message.
 *
 * They are renumbered here, and a couple of lines are re-pointed away from
 * language that only fits a parent writing about a child.
 */

const generalGettingStarted: SectionDef = {
  ...gettingStarted,
  intro:
    "A Letter of Intent is a plain-language guide to caring for someone — " +
    "everything the person who steps in would need to know but could never " +
    "guess. It is not a legal document, and that is its strength: no forms, no " +
    "signatures, just the notes only you could write.\n\n" +
    "Most families finish in 40 to 80 minutes, usually across a few sittings. " +
    "Everything saves automatically on this device as you type. Every question " +
    "is optional. Skip anything. Come back anytime. There is no wrong way to do this.",
};

const generalFinalWishes: SectionDef = { ...finalWishes, number: 13 };

const generalPersonalMessage: SectionDef = {
  ...personalMessage,
  number: 14,
  fields: personalMessage.fields.map((f) =>
    f.id === "toSiblings"
      ? {
          ...f,
          label: "To the rest of the family",
          help:
            "Gratitude, permission, hopes — and anything they will need to be " +
            "released from. This is the place to say that no one is expected to " +
            "carry it the way you did.",
        }
      : f
  ),
};

/** The fourteen sections of the general path, in "Next" order. */
export const generalSectionDefs: SectionDef[] = [
  generalGettingStarted,
  aboutThem,
  familySupport,
  typicalWeek,
  dailyCommunication,
  healthMedical,
  homeLiving,
  moneyDocuments,
  workObligations,
  faithCommunity,
  legalDecisions,
  steppingIn,
  generalFinalWishes,
  generalPersonalMessage,
];
