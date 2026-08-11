/**
 * The gentle gap lines the live reading view (/letter/read) shows where a
 * section has no notes yet. Keyed by canonical section slug — one entry per
 * section in the one roster (content.test.ts holds the two together).
 *
 * Each line names the CONSEQUENCE of the gap for a future reader, never the
 * writer's shortfall: "a caregiver would not yet know…", not "you have not
 * filled in…". A section the family marked not-applicable never gets one of
 * these — that mark is an answer, not a gap.
 */
export const readingGaps: Record<string, string> = {
  "getting-started":
    "A reader would not yet know who this letter is about, or who wrote it.",
  "about-them": "A reader would not yet know who {name} is beyond a name.",
  "family-and-support":
    "A reader would not yet know who helps {name} today, or who to call first.",
  "typical-days":
    "A reader would not yet know what an ordinary day looks like for {name}.",
  communication:
    "A reader would not yet know how {name} communicates, or the signs that something hurts.",
  "health-and-medical":
    "A reader would not yet know {name}'s conditions, medications, or doctors.",
  "behavioral-support":
    "A caregiver would not yet know what triggers hard moments, or what helps {name} through them.",
  allergies:
    "A reader would not yet know what {name} is allergic to, or what a reaction looks like.",
  "emergency-plan":
    "A caregiver would not yet know what to do if something goes wrong, or when to call 911.",
  "daily-routines":
    "A caregiver would not yet know the routines that keep {name}'s day steady.",
  "food-and-eating":
    "A caregiver would not yet know what {name} will eat, or what is not safe.",
  "personal-care":
    "A caregiver would not yet know the daily care {name} needs, or the steps that make it go well.",
  "home-and-daily-living":
    "A reader would not yet know where {name} lives, or what makes it work.",
  "school-and-work":
    "A reader would not yet know about {name}'s school, program, or work, or who matters there.",
  "money-and-benefits":
    "A trustee would not yet know how the bills get paid, or which benefits must be protected.",
  "legal-and-decisions": "A reader would not yet know who may decide what for {name}.",
  "friends-joy-and-faith":
    "A reader would not yet know what brings {name} joy, or which friendships to protect.",
  "guidance-for-the-trustee":
    "The trustee would not yet know how you would want the money used, or where the limits are.",
  "for-whoever-steps-in":
    "Whoever steps in would not yet know what the first week should look like.",
  "final-wishes": "A reader would not yet know your wishes for the very end.",
  "a-personal-message":
    "There is no message in your own voice yet. It is often the page families treasure most.",
};
