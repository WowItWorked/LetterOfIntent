import type { SectionDef } from "@/lib/content/types";
import { gettingStarted } from "./01-getting-started";
import { about } from "./02-about";
import { familySupport } from "./03-family-support";
import { typicalDay } from "./04-typical-day";
import { communication } from "./05-communication";
import { medical } from "./06-medical";
import { behavior } from "./07-behavior";
import { educationWork } from "./08-education-work";
import { housing } from "./09-housing";
import { benefitsFinances } from "./10-benefits-finances";
import { socialFaith } from "./11-social-faith";
import { legalAdvocacy } from "./12-legal-advocacy";
import { trustee } from "./13-trustee";
import { finalWishes } from "./14-final-wishes";
import { personalMessage } from "./15-personal-message";

/** All fifteen sections, in the default "Next" order. */
export const sectionDefs: SectionDef[] = [
  gettingStarted,
  about,
  familySupport,
  typicalDay,
  communication,
  medical,
  behavior,
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
