import type { SectionDef } from "@/lib/content/types";
import { gettingStarted } from "./01-getting-started";
import { about } from "./02-about";
import { familySupport } from "./03-family-support";
import { typicalDay } from "./04-typical-day";
import { communication } from "./05-communication";
import { medical } from "./06-medical";
import { behavior } from "./07-behavior";
import { allergies } from "./08-allergies";
import { emergencyPlan } from "./09-emergency-plan";
import { routines } from "./10-routines";
import { foods } from "./11-foods";
import { careTasks } from "./12-care-tasks";
import { educationWork } from "./13-education-work";
import { housing } from "./14-housing";
import { benefitsFinances } from "./15-benefits-finances";
import { socialFaith } from "./16-social-faith";
import { legalAdvocacy } from "./17-legal-advocacy";
import { trustee } from "./18-trustee";
import { finalWishes } from "./19-final-wishes";
import { personalMessage } from "./20-personal-message";

/**
 * All twenty sections, in the default "Next" order. The five card-data
 * sections (allergies through personal care) cluster right after the
 * medical/behavior region they structure, and every one of them is optional.
 */
export const sectionDefs: SectionDef[] = [
  gettingStarted,
  about,
  familySupport,
  typicalDay,
  communication,
  medical,
  behavior,
  allergies,
  emergencyPlan,
  routines,
  foods,
  careTasks,
  educationWork,
  housing,
  benefitsFinances,
  socialFaith,
  legalAdvocacy,
  trustee,
  finalWishes,
  personalMessage,
];

export function sectionBySlug(slug: string): SectionDef | undefined {
  return sectionDefs.find((s) => s.slug === slug);
}

export function nextSection(slug: string): SectionDef | undefined {
  const i = sectionDefs.findIndex((s) => s.slug === slug);
  return i >= 0 ? sectionDefs[i + 1] : undefined;
}

export function prevSection(slug: string): SectionDef | undefined {
  const i = sectionDefs.findIndex((s) => s.slug === slug);
  return i > 0 ? sectionDefs[i - 1] : undefined;
}
