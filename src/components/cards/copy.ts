import { fillName } from "@/lib/derive";

/**
 * The three pagination warnings, as copy beside the components that show them
 * (owner's spec + Phase F's pagination result):
 *
 * - emergency-overflow: the Emergency card never splits, and its download is
 *   deliberately blocked while it overflows — a protocol continuing on a card
 *   a responder does not have is worse than asking the family to shorten it.
 * - overflowBlocks: a non-emergency card ran past its four pages; the download
 *   proceeds, but never silently — the notice names what was left off.
 * - oversizedBlocks: a single block taller than a whole card renders cropped
 *   (the 39px type floor is not negotiable); the download proceeds with a
 *   warning naming the block.
 *
 * Warm, plain, never an error tone: the cards are a bonus, not homework.
 */

/** "a, b, and c" — same joining rule the card statuses use. */
function listJoin(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

const quoted = (labels: readonly string[]) => listJoin(labels.map((l) => `“${l}”`));

/** Carries {name}; emergencyOverflowCopy fills it before display. */
export const EMERGENCY_OVERFLOW_TEMPLATE =
  "This card holds more than one card can carry, and the Emergency Protocol is the one " +
  "card that never continues onto a second page — a step in {name}'s plan sitting on a " +
  "card a responder isn't holding is worse than a shorter plan. Its download stays off " +
  "until everything fits. The quickest fix is usually the response steps: open the " +
  "Emergency plan section and keep only the steps a stranger truly needs, in the fewest " +
  "words that are still true.";

/** Warm but firm: what happened, why the download is blocked, and the shortest way out. */
export function emergencyOverflowCopy(name: string): string {
  return fillName(EMERGENCY_OVERFLOW_TEMPLATE, name);
}

/** Names every block that missed the last allowed page — never a silent drop. */
export function overflowNotice(blockLabels: readonly string[]): string {
  const one = blockLabels.length === 1;
  return (
    `A card set stops at four cards so it stays a card set, and not everything fit: ` +
    `${quoted(blockLabels)} ${one ? "was" : "were"} left off. The cards keep the most ` +
    `important blocks, in order; the full detail is always in the letter itself.`
  );
}

/** Names a block taller than a whole card, which renders cropped rather than shrunk. */
export function oversizedNotice(blockLabels: readonly string[]): string {
  const one = blockLabels.length === 1;
  return (
    `${quoted(blockLabels)} ${one ? "is" : "are"} taller than one card, so the card ` +
    `shows what fits and crops the rest — the type never shrinks below readable. ` +
    `Shortening that answer in the letter brings the whole block back.`
  );
}
