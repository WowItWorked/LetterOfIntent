import { describe, expect, it } from "vitest";
import {
  CARD_KEYS,
  RENDER_REQUIREMENTS,
  SOURCES,
  type CardKey,
} from "@/lib/content/cards";
import { requirementsMet } from "@/lib/cards/derive";
import {
  cardsForField,
  cardsForSection,
  cardStatus,
  cardTitle,
  fieldMarkerText,
  MISSING_COPY,
  needKey,
  needsMissing,
  sectionCardStatuses,
} from "@/lib/cards/status";
import type { LetterData, LetterPath } from "@/lib/schema";

const PATHS: readonly LetterPath[] = ["special-needs", "general"];

/* ------------------------------------------------------------ reverse index */

describe("the reverse index mirrors SOURCES exactly", () => {
  it("maps every non-legacy SOURCES entry to exactly its cards, on both paths", () => {
    for (const path of PATHS) {
      // Independent re-derivation: what the index SHOULD say, per field.
      const expected = new Map<string, Set<CardKey>>();
      for (const card of CARD_KEYS) {
        for (const src of SOURCES[card][path]) {
          if (src.tier === "legacy_fallback") continue;
          const key = `${src.section}.${src.field}`;
          const set = expected.get(key) ?? new Set<CardKey>();
          set.add(card);
          expected.set(key, set);
        }
      }
      expect(expected.size).toBeGreaterThan(0);
      for (const [key, cards] of expected) {
        const [section, field] = key.split(".") as [keyof LetterData, string];
        expect(
          new Set(cardsForField(path, section, field)),
          `${path} ${key}`
        ).toEqual(cards);
      }
    }
  });

  it("keeps CARD_KEYS order, so multi-card markers always read the same way", () => {
    for (const path of PATHS) {
      for (const card of CARD_KEYS) {
        for (const src of SOURCES[card][path]) {
          const cards = cardsForField(path, src.section, src.field);
          const order = cards.map((c) => CARD_KEYS.indexOf(c));
          expect(order, `${path} ${src.section}.${src.field}`).toEqual(
            [...order].sort((a, b) => a - b)
          );
        }
      }
    }
  });

  it("legacy fallback prose gets no marker — it reaches a card only while the records are empty", () => {
    let legacySeen = 0;
    for (const path of PATHS) {
      for (const card of CARD_KEYS) {
        for (const src of SOURCES[card][path]) {
          if (src.tier !== "legacy_fallback") continue;
          legacySeen += 1;
          expect(
            cardsForField(path, src.section, src.field),
            `${path} ${src.section}.${src.field}`
          ).not.toContain(card);
        }
      }
    }
    expect(legacySeen).toBeGreaterThan(0); // the rule above actually ran
  });

  it("a letter-only field maps to nothing", () => {
    expect(cardsForField("special-needs", "gettingStarted", "letterDate")).toEqual([]);
    expect(cardsForField("general", "gettingStarted", "letterDate")).toEqual([]);
  });

  it("rolls fields up to sections", () => {
    expect(cardsForSection("special-needs", "medical")).toEqual([
      "identity",
      "emergency",
      "meds",
      "care",
    ]);
    expect(cardsForSection("general", "homeLiving")).toEqual(["care"]);
    expect(cardsForSection("special-needs", "trustee")).toEqual([]);
  });
});

/* ------------------------------------------------------------ field markers */

describe("fieldMarkerText", () => {
  it("names cards from CARD_DEFS, singular and plural", () => {
    expect(fieldMarkerText("special-needs", "emergencyPlan", "responseSteps")).toBe(
      `Appears on the ${cardTitle("emergency")} card.`
    );
    expect(fieldMarkerText("special-needs", "familySupport", "contacts")).toBe(
      `Appears on the ${cardTitle("identity")} and ${cardTitle("emergency")} cards.`
    );
    expect(fieldMarkerText("general", "healthMedical", "medications")).toBe(
      `Appears on the ${cardTitle("emergency")} and ${cardTitle("meds")} cards.`
    );
  });

  it("is silent for fields that feed nothing", () => {
    expect(fieldMarkerText("special-needs", "gettingStarted", "letterDate")).toBeUndefined();
  });

  it("pins the titles the markers are built from", () => {
    // A CARD_DEFS title change should be a conscious choice, not a surprise.
    expect(cardTitle("identity")).toBe("Identity & Contacts");
    expect(cardTitle("emergency")).toBe("Emergency Protocol");
    expect(cardTitle("meds")).toBe("Medications");
    expect(cardTitle("behavior")).toBe("Behavior & Communication");
  });
});

/* --------------------------------------------------------- requirement copy */

describe("missing-requirement copy", () => {
  it("every render requirement has a warm phrase — a new need must bring its copy", () => {
    for (const key of CARD_KEYS) {
      for (const need of RENDER_REQUIREMENTS[key]) {
        const copy = MISSING_COPY[needKey(need)];
        expect(
          copy,
          `RENDER_REQUIREMENTS.${key} need [${needKey(need)}] has no phrase in MISSING_COPY`
        ).toBeTypeOf("string");
        expect((copy ?? "").trim().length, `${key} phrase is blank`).toBeGreaterThan(0);
      }
    }
  });

  it("carries no orphaned phrases for requirements that no longer exist", () => {
    const live = new Set(CARD_KEYS.flatMap((k) => RENDER_REQUIREMENTS[k].map(needKey)));
    for (const key of Object.keys(MISSING_COPY)) {
      expect(live.has(key), `MISSING_COPY entry [${key}] matches no requirement`).toBe(true);
    }
  });
});

/* ----------------------------------------------------------------- statuses */

const nameAndContact: LetterData = {
  gettingStarted: { subjectFullName: "Alex Rivera" },
  familySupport: { contacts: [{ id: "c1", name: "Dana" }] },
};

const fixtures: ReadonlyArray<{ name: string; data: LetterData }> = [
  { name: "empty letter", data: {} },
  { name: "name only", data: { gettingStarted: { subjectFullName: "Alex Rivera" } } },
  { name: "name and contact", data: nameAndContact },
  {
    name: "kept-off contact",
    data: { familySupport: { contacts: [{ id: "c1", name: "Dana", keepOffCards: true }] } },
  },
  {
    name: "blank record only",
    data: { familySupport: { contacts: [{ id: "c1" }] } },
  },
  {
    name: "rescue med",
    data: { medical: { medications: [{ id: "m1", name: "Diazepam", isRescue: true }] } },
  },
  {
    name: "daily med only",
    data: { medical: { medications: [{ id: "m1", name: "Melatonin", isRescue: false }] } },
  },
  {
    name: "routine prose both paths",
    data: {
      typicalDay: { morningRoutine: "Slow start, lights low." },
      typicalWeek: { mornings: "Coffee before conversation." },
    },
  },
  {
    name: "food record",
    data: { foods: { items: [{ id: "f1", item: "Grapes", type: "choking_risk" }] } },
  },
  {
    name: "care prose both paths",
    data: {
      homeLiving: { personalCare: "Manages, slowly." },
      medical: { equipment: "Walker by the door." },
    },
  },
  {
    name: "behavior anchors both paths",
    data: {
      communication: { how: "Signs, about twenty." },
      dailyCommunication: { howToSpeak: "Directly, once." },
    },
  },
];

describe("cardStatus", () => {
  it("phrase selection agrees with requirementsMet on every fixture, card, and path", () => {
    // requirementsMet is the authority; needsMissing only picks the wording.
    // If derive's private refHasContent ever drifts from the probe here, this
    // is the test that says so.
    for (const f of fixtures) {
      for (const path of PATHS) {
        for (const key of CARD_KEYS) {
          expect(
            needsMissing(f.data, path, key).length === 0,
            `${f.name} / ${path} / ${key}`
          ).toBe(requirementsMet(f.data, path, key));
        }
      }
    }
  });

  it("a ready card says so in one plain line", () => {
    const s = cardStatus(nameAndContact, "special-needs", "identity");
    expect(s.ready).toBe(true);
    expect(s.text).toBe(`The ${cardTitle("identity")} card has what it needs.`);
  });

  it("names only what is actually missing", () => {
    const s = cardStatus(
      { gettingStarted: { subjectFullName: "Alex Rivera" } },
      "special-needs",
      "identity"
    );
    expect(s.ready).toBe(false);
    expect(s.text).toBe(`The ${cardTitle("identity")} card needs at least one person to call.`);
  });

  it("joins several missing needs into one sentence", () => {
    const s = cardStatus({}, "special-needs", "identity");
    expect(s.ready).toBe(false);
    expect(s.text).toBe(
      `The ${cardTitle("identity")} card needs their name and at least one person to call.`
    );
  });

  it("fills {name} tokens before display", () => {
    const s = cardStatus(
      { gettingStarted: { subjectPreferredName: "Bee" } },
      "special-needs",
      "behavior"
    );
    expect(s.text).toContain("Bee");
    expect(s.text).not.toContain("{name}");
  });

  it("a kept-off record never satisfies a card", () => {
    const withKeptOff: LetterData = {
      gettingStarted: { subjectFullName: "Alex Rivera" },
      familySupport: { contacts: [{ id: "c1", name: "Dana", keepOffCards: true }] },
    };
    const s = cardStatus(withKeptOff, "special-needs", "identity");
    expect(s.ready).toBe(false);
    expect(s.text).toContain("at least one person to call");
  });

  it("the emergency card needs a rescue medication, not just any medication", () => {
    const daily: LetterData = {
      medical: { medications: [{ id: "m1", name: "Melatonin", isRescue: false }] },
    };
    expect(cardStatus(daily, "special-needs", "emergency").ready).toBe(false);
    expect(cardStatus(daily, "special-needs", "meds").ready).toBe(true);
    const rescue: LetterData = {
      medical: { medications: [{ id: "m1", name: "Diazepam", isRescue: true }] },
    };
    expect(cardStatus(rescue, "special-needs", "emergency").ready).toBe(true);
  });
});

describe("sectionCardStatuses", () => {
  it("returns one status per card the section feeds, in card order", () => {
    const statuses = sectionCardStatuses({}, "special-needs", "medical");
    expect(statuses.map((s) => s.key)).toEqual(["identity", "emergency", "meds", "care"]);
    for (const s of statuses) expect(s.text.length).toBeGreaterThan(0);
  });

  it("is empty for a section that feeds no card", () => {
    expect(sectionCardStatuses({}, "special-needs", "finalWishes")).toEqual([]);
  });
});
