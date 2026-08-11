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
import type { LetterData } from "@/lib/schema";

/* ------------------------------------------------------------ reverse index */

describe("the reverse index mirrors SOURCES exactly", () => {
  it("maps every non-legacy SOURCES entry to exactly its cards", () => {
    // Independent re-derivation: what the index SHOULD say, per field.
    const expected = new Map<string, Set<CardKey>>();
    for (const card of CARD_KEYS) {
      for (const src of SOURCES[card]) {
        if (src.tier === "legacy_fallback") continue;
        const key = `${src.section}.${src.field}`;
        const set = expected.get(key) ?? new Set<CardKey>();
        set.add(card);
        expected.set(key, set);
      }
    }
    expect(expected.size).toBeGreaterThan(0);
    for (const [key, cards] of expected) {
      const [section, field] = key.split(".") as [
        Exclude<keyof LetterData, "marks">,
        string,
      ];
      expect(new Set(cardsForField(section, field)), key).toEqual(cards);
    }
  });

  it("keeps CARD_KEYS order, so multi-card markers always read the same way", () => {
    for (const card of CARD_KEYS) {
      for (const src of SOURCES[card]) {
        const cards = cardsForField(src.section, src.field);
        const order = cards.map((c) => CARD_KEYS.indexOf(c));
        expect(order, `${src.section}.${src.field}`).toEqual([...order].sort((a, b) => a - b));
      }
    }
  });

  it("legacy fallback prose gets no marker — it reaches a card only while the records are empty", () => {
    let legacySeen = 0;
    for (const card of CARD_KEYS) {
      for (const src of SOURCES[card]) {
        if (src.tier !== "legacy_fallback") continue;
        legacySeen += 1;
        expect(cardsForField(src.section, src.field), `${src.section}.${src.field}`).not.toContain(
          card
        );
      }
    }
    expect(legacySeen).toBeGreaterThan(0); // the rule above actually ran
  });

  it("a letter-only field maps to nothing", () => {
    expect(cardsForField("gettingStarted", "letterDate")).toEqual([]);
  });

  it("rolls fields up to sections", () => {
    expect(cardsForSection("health")).toEqual(["identity", "emergency", "meds", "care"]);
    expect(cardsForSection("home")).toEqual(["care"]);
    expect(cardsForSection("trusteeGuidance")).toEqual([]);
  });
});

/* ------------------------------------------------------------ field markers */

describe("fieldMarkerText", () => {
  it("names cards from CARD_DEFS, singular and plural", () => {
    expect(fieldMarkerText("emergencyPlan", "responseSteps")).toBe(
      `Appears on the ${cardTitle("emergency")} card.`
    );
    expect(fieldMarkerText("familySupport", "contacts")).toBe(
      `Appears on the ${cardTitle("identity")} and ${cardTitle("emergency")} cards.`
    );
    expect(fieldMarkerText("health", "medications")).toBe(
      `Appears on the ${cardTitle("emergency")} and ${cardTitle("meds")} cards.`
    );
  });

  it("is silent for fields that feed nothing", () => {
    expect(fieldMarkerText("gettingStarted", "letterDate")).toBeUndefined();
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
    data: { health: { medications: [{ id: "m1", name: "Diazepam", isRescue: true }] } },
  },
  {
    name: "daily med only",
    data: { health: { medications: [{ id: "m1", name: "Melatonin", isRescue: false }] } },
  },
  {
    name: "routine prose",
    data: { routine: { mornings: "Slow start, lights low." } },
  },
  {
    name: "food record",
    data: { foods: { items: [{ id: "f1", item: "Grapes", type: "choking_risk" }] } },
  },
  {
    name: "care prose",
    data: {
      home: { personalCare: "Manages, slowly." },
      health: { equipment: "Walker by the door." },
    },
  },
  {
    name: "either communication direction",
    data: {
      communication: { how: "Signs, about twenty.", howToSpeak: "Directly, once." },
    },
  },
];

describe("cardStatus", () => {
  it("phrase selection agrees with requirementsMet on every fixture and card", () => {
    // requirementsMet is the authority; needsMissing only picks the wording.
    for (const f of fixtures) {
      for (const key of CARD_KEYS) {
        expect(needsMissing(f.data, key).length === 0, `${f.name} / ${key}`).toBe(
          requirementsMet(f.data, key)
        );
      }
    }
  });

  it("a ready card says so in one plain line", () => {
    const s = cardStatus(nameAndContact, "identity");
    expect(s.ready).toBe(true);
    expect(s.text).toBe(`The ${cardTitle("identity")} card has what it needs.`);
  });

  it("names only what is actually missing", () => {
    const s = cardStatus({ gettingStarted: { subjectFullName: "Alex Rivera" } }, "identity");
    expect(s.ready).toBe(false);
    expect(s.text).toBe(`The ${cardTitle("identity")} card needs at least one person to call.`);
  });

  it("joins several missing needs into one sentence", () => {
    const s = cardStatus({}, "identity");
    expect(s.ready).toBe(false);
    expect(s.text).toBe(
      `The ${cardTitle("identity")} card needs their name and at least one person to call.`
    );
  });

  it("fills {name} tokens before display", () => {
    const s = cardStatus({ gettingStarted: { subjectPreferredName: "Bee" } }, "behavior");
    expect(s.text).toContain("Bee");
    expect(s.text).not.toContain("{name}");
  });

  it("a kept-off record never satisfies a card", () => {
    const withKeptOff: LetterData = {
      gettingStarted: { subjectFullName: "Alex Rivera" },
      familySupport: { contacts: [{ id: "c1", name: "Dana", keepOffCards: true }] },
    };
    const s = cardStatus(withKeptOff, "identity");
    expect(s.ready).toBe(false);
    expect(s.text).toContain("at least one person to call");
  });

  it("the emergency card needs a rescue medication, not just any medication", () => {
    const daily: LetterData = {
      health: { medications: [{ id: "m1", name: "Melatonin", isRescue: false }] },
    };
    expect(cardStatus(daily, "emergency").ready).toBe(false);
    expect(cardStatus(daily, "meds").ready).toBe(true);
    const rescue: LetterData = {
      health: { medications: [{ id: "m1", name: "Diazepam", isRescue: true }] },
    };
    expect(cardStatus(rescue, "emergency").ready).toBe(true);
  });

  it("either direction of communication anchors the behavior card", () => {
    expect(cardStatus({ communication: { how: "Signs." } }, "behavior").ready).toBe(true);
    expect(
      cardStatus({ communication: { howToSpeak: "Directly, once." } }, "behavior").ready
    ).toBe(true);
    expect(cardStatus({}, "behavior").ready).toBe(false);
  });
});

describe("sectionCardStatuses", () => {
  it("returns one status per card the section feeds, in card order", () => {
    const statuses = sectionCardStatuses({}, "health");
    expect(statuses.map((s) => s.key)).toEqual(["identity", "emergency", "meds", "care"]);
    for (const s of statuses) expect(s.text.length).toBeGreaterThan(0);
  });

  it("is empty for a section that feeds no card", () => {
    expect(sectionCardStatuses({}, "finalWishes")).toEqual([]);
  });
});
