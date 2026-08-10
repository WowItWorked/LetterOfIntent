import type { SectionDef } from "@/lib/content/types";
import { gettingStarted } from "../01-getting-started";
import { familySupport } from "../03-family-support";
import { allergies } from "../08-allergies";
import { emergencyPlan } from "../09-emergency-plan";
import { routines } from "../10-routines";
import { foods } from "../11-foods";
import { careTasks } from "../12-care-tasks";
import { finalWishes } from "../19-final-wishes";
import { personalMessage } from "../20-personal-message";
import { aboutThem } from "./02-about-them";
import { typicalWeek } from "./04-typical-week";
import { dailyCommunication } from "./05-communication";
import { healthMedical } from "./06-health-medical";
import { homeLiving } from "./12-home-living";
import { moneyDocuments } from "./13-money-documents";
import { workObligations } from "./14-work-obligations";
import { faithCommunity } from "./15-faith-community";
import { legalDecisions } from "./16-legal-decisions";
import { steppingIn } from "./17-stepping-in";

/**
 * Nine sections ask the same thing whichever letter you are writing, so both
 * paths share their definition — and their data. A family that starts one
 * letter and switches keeps the names, the people, the allergy records, and
 * the message.
 *
 * They are renumbered here, and a couple of lines are re-pointed away from
 * language that only fits a parent writing about a child.
 */

const generalGettingStarted: SectionDef = {
  ...gettingStarted,
  intro:
    "A Letter of Intent is a plain-language guide to caring for someone: " +
    "everything the person who steps in would need to know but could never " +
    "guess. It is not a legal document, and that is its strength: no forms, no " +
    "signatures, just the notes only you could write.\n\n" +
    "Most families finish in 40 minutes to two hours, usually across a few " +
    "sittings. Everything saves automatically on this device as you type. Every " +
    "question is optional. Skip anything. Come back anytime. There is no wrong " +
    "way to do this.",
};

// The shared card-data cluster sits after health & medical here, one earlier
// than its special-needs numbering (no behavior section on this path).
const generalAllergies: SectionDef = { ...allergies, number: 7 };
const generalEmergencyPlan: SectionDef = { ...emergencyPlan, number: 8 };
const generalRoutines: SectionDef = { ...routines, number: 9 };
const generalFoods: SectionDef = { ...foods, number: 10 };
const generalCareTasks: SectionDef = { ...careTasks, number: 11 };

const generalFinalWishes: SectionDef = { ...finalWishes, number: 18 };

const generalPersonalMessage: SectionDef = {
  ...personalMessage,
  number: 19,
  fields: personalMessage.fields.map((f) =>
    f.id === "toSiblings"
      ? {
          ...f,
          label: "To the rest of the family",
          help:
            "Gratitude, permission, hopes, and anything they will need to be " +
            "released from. This is the place to say that no one is expected to " +
            "carry it the way you did.",
        }
      : f
  ),
};

/** The nineteen sections of the general path, in "Next" order. */
export const generalSectionDefs: SectionDef[] = [
  generalGettingStarted,
  aboutThem,
  familySupport,
  typicalWeek,
  dailyCommunication,
  healthMedical,
  generalAllergies,
  generalEmergencyPlan,
  generalRoutines,
  generalFoods,
  generalCareTasks,
  homeLiving,
  moneyDocuments,
  workObligations,
  faithCommunity,
  legalDecisions,
  steppingIn,
  generalFinalWishes,
  generalPersonalMessage,
];
