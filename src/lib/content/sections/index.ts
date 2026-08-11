import type { SectionDef } from "@/lib/content/types";
import { gettingStarted } from "./01-getting-started";
import { person } from "./02-person";
import { familySupport } from "./03-family-support";
import { routine } from "./04-routine";
import { communication } from "./05-communication";
import { health } from "./06-health";
import { behavior } from "./07-behavior";
import { allergies } from "./08-allergies";
import { emergencyPlan } from "./09-emergency-plan";
import { routines } from "./10-routines";
import { foods } from "./11-foods";
import { careTasks } from "./12-care-tasks";
import { home } from "./13-home";
import { schoolWork } from "./14-school-work";
import { moneyBenefits } from "./15-money-benefits";
import { legal } from "./16-legal";
import { communityFaith } from "./17-community-faith";
import { trusteeGuidance } from "./18-trustee-guidance";
import { caregiverGuidance } from "./19-caregiver-guidance";
import { finalWishes } from "./20-final-wishes";
import { personalMessage } from "./21-personal-message";

/**
 * THE canonical roster, in reading order. There is exactly one; which of
 * these sections a given family is asked lives in each def's `showWhen`,
 * resolved against the onboarding answers by lib/content/config.ts.
 */
export const sectionDefs: SectionDef[] = [
  gettingStarted,
  person,
  familySupport,
  routine,
  communication,
  health,
  behavior,
  allergies,
  emergencyPlan,
  routines,
  foods,
  careTasks,
  home,
  schoolWork,
  moneyBenefits,
  legal,
  communityFaith,
  trusteeGuidance,
  caregiverGuidance,
  finalWishes,
  personalMessage,
];
