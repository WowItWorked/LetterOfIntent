import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ageFrom,
  deriveCard,
  enforceCriticalCap,
  requirementsMet,
  TOKEN_MINUTES,
} from "@/lib/cards/derive";
import { assignPages } from "@/lib/cards/paginate";
import { CARD_KEYS, MED_TIME_OF_DAY_ORDER } from "@/lib/content/cards";
import type { CardBlock, CardData } from "@/lib/cards/types";
import type { LetterData } from "@/lib/schema";

/**
 * Fixtures simulate what a family actually types: free text, entered in the
 * order it occurred to them, with the structured records the Phase C wizard
 * will collect. Every assertion here is about derivation rules — what lands
 * on a card, in what order, and what stays off.
 */

function snLetter(overrides: Partial<LetterData> = {}): LetterData {
  return {
    gettingStarted: {
      subjectFullName: "Bonnie Marie Kelly",
      subjectPreferredName: "Bonnie",
      subjectAddress: "12 Maple Street, Rome, GA",
      letterDate: "2026-08-08",
    },
    person: { dateOfBirth: "2015-01-15" },
    familySupport: {
      contacts: [
        {
          id: "c1",
          name: "Jessie",
          relationship: "Mother",
          phone: "555-0101",
          roles: ["primary"],
        },
        {
          id: "c2",
          name: "Norm",
          relationship: "Neighbor",
          phone: "555-0103",
          roles: ["neighbor_backup"],
        },
      ],
    },
    health: {
      medications: [
        {
          id: "m1",
          name: "Epinephrine auto-injector",
          isRescue: true,
          location: "Red pouch, front left of the backpack",
        },
        { id: "m2", name: "Melatonin", dose: "3", unit: "mg", schedule: ["bedtime"] },
      ],
      providers: [{ id: "p1", name: "Dr. Okafor", specialty: "Neurology", phone: "555-0200" }],
      preferredHospital: "Rome General",
      equipment: "The wheelchair lives by the back door.",
    },
    allergies: {
      items: [
        {
          id: "a1",
          allergen: "Bee stings",
          reaction: "anaphylaxis",
          severity: "life-threatening",
        },
        { id: "a2", allergen: "Amoxicillin", reaction: "hives", severity: "mild" },
      ],
    },
    emergencyPlan: {
      responseSteps: "Auto-injector, outer thigh, through clothing\nCall 911\nCall Jessie",
      scenarios: [
        {
          id: "s1",
          trigger: "If she is stung",
          steps: "1. Auto-injector, outer thigh\nCall 911\nKeep her lying down",
        },
        {
          id: "s2",
          trigger: "If she bolts",
          steps: "Check closets, under beds, behind doors\nShe hides, she does not run",
        },
      ],
      call911When: "Trouble breathing or swelling of the face",
      otherwiseCall: "Jessie",
      ifNoOneAnswers: "Knock on the blue house next door.",
      otcPolicy: "No medicine we have not approved first.",
    },
    communication: {
      how: "Short sentences. One thing at a time.",
      yesNo: "Thumbs up means yes.",
      pain: "Goes quiet and holds the spot.",
    },
    behavior: {
      triggers: "Loud sudden noises.",
      deEscalation: "Dim the lights. Stay quiet and still.",
    },
    routines: {
      items: [
        { id: "r1", timeOfDay: "evening", time: "7:00", steps: "Bath\nPajamas\nOne story" },
        { id: "r2", timeOfDay: "morning", time: "7:30", steps: "Breakfast first, then clothes" },
      ],
      transitions: "Give a five-minute warning before anything changes.",
    },
    foods: {
      items: [
        { id: "f1", item: "Grapes", type: "choking_risk", reason: "must be cut in quarters" },
        { id: "f2", item: "Buttered noodles", type: "always_works" },
      ],
    },
    careTasks: {
      items: [
        {
          id: "t1",
          category: "bathing",
          steps: "Water running before they get in.\nRinse with the cup, never the sprayer.",
        },
      ],
    },
    ...overrides,
  };
}

function generalLetter(overrides: Partial<LetterData> = {}): LetterData {
  return {
    gettingStarted: {
      subjectFullName: "Walter Kelly",
      subjectPreferredName: "Walt",
      letterDate: "2026-08-08",
    },
    person: { dateOfBirth: "1948-03-02", cannotAbide: "Being talked over." },
    familySupport: {
      contacts: [
        { id: "c1", name: "Pat", relationship: "Son", phone: "555-0300", emergency: true },
      ],
    },
    health: {
      medications: [
        { id: "m1", name: "Metoprolol", dose: "50", unit: "mg", schedule: ["morning"] },
      ],
      preferredHospital: "St. Mary's",
    },
    communication: {
      howToSpeak: "Speak facing them, a little slower than feels natural.",
      whatHelps: "A cup of tea and a change of subject.",
    },
    routine: {
      mornings: "Slow. Coffee before conversation.",
      food: "Toast and jam most mornings.",
    },
    home: {
      personalCare: "A steadying hand on the stairs.",
      safety: "The bathroom rug slips.",
    },
    emergencyPlan: { call911When: "Chest pain, or a fall they cannot get up from." },
    ...overrides,
  };
}

function blockLabels(card: CardData | null): string[] {
  return card?.blocks.map((b) => b.label) ?? [];
}

function block(card: CardData | null, label: string): CardBlock | undefined {
  return card?.blocks.find((b) => b.label === label);
}

afterEach(() => {
  vi.useRealTimers();
});

/* ----------------------------------------------------------- shared rules */

describe("deriveCard shared rules", () => {
  it("a rescue medication entered once appears on both the emergency and meds cards", () => {
    const data = snLetter();
    const emergency = deriveCard(data, "emergency");
    const meds = deriveCard(data, "meds");

    const onEmergency = block(emergency, "Rescue medication");
    const onMeds = block(meds, "Rescue medication");
    expect(onEmergency?.lines[0].k).toBe("Epinephrine auto-injector — ");
    expect(onMeds?.lines[0].k).toBe("Epinephrine auto-injector — ");
    expect(onEmergency?.lines[0].v).toContain("Red pouch");
    expect(onMeds?.lines[0].v).toContain("Red pouch");
  });

  it("keepOffCards holds a record out of every card it would otherwise reach", () => {
    const data = snLetter();
    data.familySupport?.contacts?.push({
      id: "c3",
      name: "Private Cousin",
      phone: "555-0999",
      roles: ["primary"],
      keepOffCards: true,
    });
    data.health?.medications?.push({
      id: "m3",
      name: "Secret Med",
      isRescue: true,
      keepOffCards: true,
    });
    data.allergies?.items?.push({
      id: "a3",
      allergen: "Private allergen",
      severity: "life-threatening",
      keepOffCards: true,
    });

    const identity = deriveCard(data, "identity");
    const emergency = deriveCard(data, "emergency");
    const meds = deriveCard(data, "meds");
    const everything = JSON.stringify([identity, emergency, meds]);
    expect(everything).not.toContain("Private Cousin");
    expect(everything).not.toContain("Secret Med");
    expect(everything).not.toContain("Private allergen");
  });

  it("requirements honor the keepOffCards exclusion — a card of held-back records is null", () => {
    const data = snLetter({
      familySupport: {
        contacts: [{ id: "c1", name: "Jessie", phone: "555-0101", keepOffCards: true }],
      },
    });
    expect(requirementsMet(data, "identity")).toBe(false);
    expect(deriveCard(data, "identity")).toBeNull();
  });

  it("never emits an empty block on any card, for either sample configuration", () => {
    for (const data of [snLetter(), generalLetter()]) {
      for (const key of CARD_KEYS) {
        const card = deriveCard(data, key);
        for (const b of card?.blocks ?? []) {
          expect(b.lines.length, `${key}/${b.label}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("derives all seven cards from a full letter of either register", () => {
    for (const key of CARD_KEYS) {
      expect(deriveCard(snLetter(), key), `high-support ${key}`).not.toBeNull();
      expect(deriveCard(generalLetter(), key), `aging ${key}`).not.toBeNull();
    }
  });
});

/* -------------------------------------------------------------- ordering */

describe("ordering", () => {
  it("allergies sort worst first; unknown severities go last but are never dropped", () => {
    const data = snLetter({
      allergies: {
        items: [
          { id: "a1", allergen: "Amoxicillin", severity: "mild" },
          { id: "a2", allergen: "Latex", severity: "somewhat bad" },
          { id: "a3", allergen: "Bee stings", severity: "life-threatening" },
          { id: "a4", allergen: "Shellfish", severity: "serious" },
        ],
      },
    });
    const card = deriveCard(data, "emergency");
    const ks = block(card, "Allergies")?.lines.map((ln) => ln.k);
    expect(ks).toEqual(["Bee stings — ", "Shellfish — ", "Amoxicillin — ", "Latex — "]);
  });

  it("scheduled meds follow the day: tokens and typed clock times interleave", () => {
    const data = snLetter({
      health: {
        medications: [
          { id: "1", name: "Dusk", schedule: ["bedtime"] },
          { id: "2", name: "Dawn", schedule: ["morning"] },
          { id: "3", name: "Afternoon", schedule: ["14:30"] },
          { id: "4", name: "Midday", schedule: ["noon"] },
          { id: "5", name: "Sometime", schedule: ["whenever the mood strikes"] },
        ],
      },
    });
    const card = deriveCard(data, "meds");
    const ks = block(card, "On a schedule")?.lines.map((ln) => ln.k);
    expect(ks).toEqual(["Dawn — ", "Midday — ", "Afternoon — ", "Dusk — ", "Sometime — "]);
  });

  it("TOKEN_MINUTES ascends in MED_TIME_OF_DAY_ORDER order — the sort trusts it", () => {
    const minutes = MED_TIME_OF_DAY_ORDER.map((t) => TOKEN_MINUTES[t]);
    expect(minutes.every((m) => typeof m === "number")).toBe(true);
    expect([...minutes].sort((a, b) => a - b)).toEqual(minutes);
  });

  it("the legacy emergency boolean sorts a contact first, like the primary role", () => {
    const data = snLetter({
      familySupport: {
        contacts: [
          { id: "c1", name: "Aunt May", phone: "555-0110" },
          { id: "c2", name: "Jessie", phone: "555-0101", emergency: true },
        ],
      },
    });
    const identity = deriveCard(data, "identity");
    expect(block(identity, "Who to call")?.lines[0].k).toBe("Jessie — ");

    const emergency = deriveCard(data, "emergency");
    expect(block(emergency, "Then call")?.lines.map((ln) => ln.k)).toEqual(["Jessie — "]);
  });

  it("routine groups run in day order regardless of entry order", () => {
    const card = deriveCard(snLetter(), "routine");
    const labels = blockLabels(card);
    expect(labels.indexOf("Morning")).toBeLessThan(labels.indexOf("Evening"));
    expect(block(card, "Morning")?.lines[0].k).toBe("7:30 · ");
    expect(block(card, "Evening")?.lines[0].k).toBe("7:00 · ");
  });
});

/* ---------------------------------------------------- emergency scenarios */

describe("emergency scenarios", () => {
  it("renders each scenario as its own block, labeled by its trigger, after What to do", () => {
    const card = deriveCard(snLetter(), "emergency");
    const labels = blockLabels(card);
    expect(labels.indexOf("What to do")).toBeGreaterThan(-1);
    expect(labels.indexOf("If she is stung")).toBeGreaterThan(labels.indexOf("What to do"));
    expect(labels.indexOf("If she bolts")).toBeGreaterThan(labels.indexOf("If she is stung"));
    expect(labels.indexOf("Call 911")).toBeGreaterThan(labels.indexOf("If she bolts"));

    // Steps are numbered exactly like responseSteps, family-typed "1." stripped.
    const stung = block(card, "If she is stung");
    expect(stung?.lines).toEqual([
      { k: "1 · ", v: "Auto-injector, outer thigh" },
      { k: "2 · ", v: "Call 911" },
      { k: "3 · ", v: "Keep her lying down" },
    ]);
  });

  it("legacy responseSteps still renders alone, and scenarios render without it", () => {
    const stepsOnly = deriveCard(
      snLetter({
        emergencyPlan: { responseSteps: "Call 911\nCall Jessie" },
      }),
      "emergency"
    );
    expect(block(stepsOnly, "What to do")?.lines.map((ln) => ln.v)).toEqual([
      "Call 911",
      "Call Jessie",
    ]);

    const scenariosOnly = deriveCard(
      snLetter({
        emergencyPlan: {
          call911When: "Trouble breathing",
          scenarios: [{ id: "s1", trigger: "If she bolts", steps: "Check closets" }],
        },
      }),
      "emergency"
    );
    expect(block(scenariosOnly, "What to do")).toBeUndefined();
    expect(block(scenariosOnly, "If she bolts")?.lines).toEqual([{ k: "1 · ", v: "Check closets" }]);
  });

  it("a trigger-less scenario falls back to the unnamed label; a step-less one is dropped", () => {
    const card = deriveCard(
      snLetter({
        emergencyPlan: {
          call911When: "Trouble breathing",
          scenarios: [
            { id: "s1", steps: "Call Jessie" },
            { id: "s2", trigger: "If she bolts" },
          ],
        },
      }),
      "emergency"
    );
    expect(block(card, "What to do")?.lines).toEqual([{ k: "1 · ", v: "Call Jessie" }]);
    expect(block(card, "If she bolts")).toBeUndefined();
  });

  it("the critical cap still holds with scenarios present: allergies and Call 911 stay the flags", () => {
    const card = deriveCard(snLetter(), "emergency");
    const critical = card?.blocks.filter((b) => b.tone === "critical").map((b) => b.label);
    expect(critical).toEqual(["Allergies", "Call 911"]);
  });

  it("the emergency card still refuses to paginate with scenarios aboard", () => {
    const card = deriveCard(snLetter(), "emergency");
    expect(card).not.toBeNull();
    if (!card) return;
    // Synthetic heights well past one page: the body stays whole and flagged.
    const heights = card.blocks.map(() => 600);
    const assigned = assignPages(heights, 1400, { key: card.key });
    expect(assigned.pages).toHaveLength(1);
    expect(assigned.pages[0]).toHaveLength(card.blocks.length);
    expect(assigned.overflowBlocks).toEqual([]);
    expect(assigned.overflow).toBe("emergency-overflow");
  });
});

/* -------------------------------------------------- contact role phrases */

describe("contact role phrases", () => {
  it("renders relationship, then role words; unknown tokens verbatim lowercased", () => {
    const data = snLetter({
      familySupport: {
        contacts: [
          {
            id: "c1",
            name: "Jessie Anderson",
            relationship: "Aunt",
            phone: "(555) 017-2264",
            roles: ["primary", "legal_guardian"],
          },
          {
            id: "c2",
            name: "Hannah Phillips",
            relationship: "Neighbor",
            phone: "(555) 017-4417",
            roles: ["neighbor_backup", "Godmother"],
          },
        ],
      },
    });
    const lines = block(deriveCard(data, "identity"), "Who to call")?.lines;
    expect(lines?.[0]).toEqual({
      k: "Jessie Anderson — ",
      v: "Aunt, first call, legal guardian · (555) 017-2264",
    });
    expect(lines?.[1]).toEqual({
      k: "Hannah Phillips — ",
      v: "Neighbor, backup, godmother · (555) 017-4417",
    });
  });

  it("falls back to the free-text role only when it reads like a role word", () => {
    const contact = (role: string) => ({
      familySupport: {
        contacts: [{ id: "c1", name: "Dana", relationship: "Aunt", phone: "555-0142", role }],
      },
    });
    // A short role word stands in for missing tokens…
    const short = deriveCard(snLetter(contact("backup")), "identity");
    expect(block(short, "Who to call")?.lines[0].v).toBe("Aunt, backup · 555-0142");
    // …but a description stays in the letter: poured into the compact line it
    // wraps the contact two or three deep and can overflow the emergency card.
    const long = deriveCard(
      snLetter(contact("Backup caregiver; knows the routines")),
      "identity"
    );
    expect(block(long, "Who to call")?.lines[0].v).toBe("Aunt · 555-0142");
  });

  it("uses the same phrasing on the emergency card's Then call", () => {
    const data = generalLetter({
      familySupport: {
        contacts: [
          {
            id: "c1",
            name: "Pat",
            relationship: "Son",
            phone: "555-0300",
            roles: ["primary"],
          },
        ],
      },
    });
    const card = deriveCard(data, "emergency");
    expect(block(card, "Then call")?.lines[0]).toEqual({
      k: "Pat — ",
      v: "Son, first call · 555-0300",
    });
  });
});

/* --------------------------------------------------- routine per-line times */

describe("routine per-line times", () => {
  it("a step opening with its own clock time stays verbatim — never a double time", () => {
    const data = snLetter({
      routines: {
        items: [
          {
            id: "r1",
            timeOfDay: "morning",
            time: "7:00 AM",
            steps:
              "7:00 - Wake. Lights low, no radio.\n7:30 - Breakfast — same bowl, same seat.",
          },
          { id: "r2", timeOfDay: "evening", time: "6:00", steps: "Dinner." },
        ],
      },
    });
    const card = deriveCard(data, "routine");
    const morning = block(card, "Morning")?.lines;
    expect(morning?.[0]).toEqual({ v: "7:00 - Wake. Lights low, no radio." });
    expect(morning?.[1]).toEqual({ v: "7:30 - Breakfast — same bowl, same seat." });
    // A first step without its own time still takes the record's.
    expect(block(card, "Evening")?.lines[0]).toEqual({ k: "6:00 · ", v: "Dinner." });
  });
});

/* --------------------------------------------------------- food grouping */

describe("food grouping", () => {
  it("groups records by type — one block per type, dangerous first, Item — reason lines", () => {
    const data = snLetter({
      foods: {
        items: [
          { id: "f1", item: "Plain pasta", type: "always_works" },
          {
            id: "f2",
            item: "Grapes",
            type: "choking_risk",
            reason: "must be quartered lengthwise",
          },
          { id: "f3", item: "Peeled apple slices", type: "always_works", reason: "peeled, always" },
          { id: "f4", item: "Crackers", type: "always_works" },
        ],
      },
    });
    const card = deriveCard(data, "food");
    const labels = blockLabels(card);
    expect(labels.indexOf("Choking risk")).toBeLessThan(labels.indexOf("Always works"));
    expect(block(card, "Always works")?.lines).toEqual([
      { v: "Plain pasta" },
      { k: "Peeled apple slices — ", v: "peeled, always." },
      { v: "Crackers" },
    ]);
    expect(block(card, "Choking risk")?.tone).toBe("critical");
    expect(block(card, "Choking risk")?.lines).toEqual([
      { k: "Grapes — ", v: "must be quartered lengthwise." },
    ]);
  });
});

/* ------------------------------------------------------- care categories */

describe("care categories", () => {
  it("labels toileting, dressing, and mobility; equipment stays the flagged block", () => {
    const data = snLetter({
      careTasks: {
        items: [
          { id: "t1", category: "toileting", steps: "Offer at every transition." },
          { id: "t2", category: "dressing", steps: "Tags cut out of everything." },
          { id: "t3", category: "mobility", steps: "Take the elevator, do not negotiate." },
          { id: "t4", category: "equipment", steps: "Headphones travel with her." },
        ],
      },
    });
    const card = deriveCard(data, "care");
    const labels = blockLabels(card);
    expect(labels).toEqual(
      expect.arrayContaining(["Toileting", "Dressing", "Getting around", "Equipment"])
    );
    expect(block(card, "Equipment")?.tone).toBe("critical");
    expect(block(card, "Toileting")?.tone).toBeUndefined();
  });
});

/* ------------------------------------------------------- legacy fallback */

describe("legacy blob coexistence", () => {
  it("the food prose renders only while there are no food records", () => {
    const proseOnly = snLetter({
      foods: undefined,
      routine: { food: "Buttered noodles always work." },
    });
    const fallback = deriveCard(proseOnly, "food");
    expect(block(fallback, "Food")?.lines[0].v).toBe("Buttered noodles always work.");

    const withRecords = snLetter({
      routine: { food: "Buttered noodles always work." },
    });
    const records = deriveCard(withRecords, "food");
    expect(block(records, "Food")).toBeUndefined();
    expect(block(records, "Choking risk")?.lines[0].k).toBe("Grapes — ");
  });
});

/* --------------------------------------------------------- requirements */

describe("render requirements", () => {
  it("returns null below the render floor — a header with nothing under it", () => {
    const noMeds = snLetter({ health: { providers: [], medications: [] } });
    expect(deriveCard(noMeds, "meds")).toBeNull();

    // Behavior requires its anchor (how they communicate); triggers alone
    // do not clear the bar.
    const noAnchor = snLetter({ communication: undefined });
    expect(deriveCard(noAnchor, "behavior")).toBeNull();

    // otherwiseCall only enriches — it cannot carry the emergency card alone.
    const enrichOnly = snLetter({
      allergies: undefined,
      health: undefined,
      emergencyPlan: { otherwiseCall: "Jessie" },
    });
    expect(deriveCard(enrichOnly, "emergency")).toBeNull();
  });

  it("either direction of communication anchors the behavior card, and fallbacks fill the blocks", () => {
    // howToSpeak alone lights the card…
    const speakOnly = deriveCard(
      generalLetter({ communication: { howToSpeak: "Directly, once." } }),
      "behavior"
    );
    expect(speakOnly).not.toBeNull();
    expect(block(speakOnly, "How they communicate")?.lines[0].v).toBe("Directly, once.");
    // …and where the sharp source is empty, the broader stand-in fills the
    // block: cannotAbide behind triggers, wontAdmit behind pain.
    const aging = deriveCard(generalLetter(), "behavior");
    expect(block(aging, "It goes sideways when")?.lines[0].v).toBe("Being talked over.");
  });

  it("the behavior card closes with first-responder guidance when it exists", () => {
    const withLE = deriveCard(
      snLetter({
        behavior: {
          triggers: "Loud noises.",
          lawEnforcement: "He may run. That is fear, not defiance.",
        },
      }),
      "behavior"
    );
    const labels = blockLabels(withLE);
    expect(labels[labels.length - 1]).toBe("For first responders");
  });
});

/* ------------------------------------------------------------- age, header */

describe("personLine, footer, and age", () => {
  it("ageFrom computes whole years and never returns NaN", () => {
    expect(ageFrom("2015-08-06", "2026-08-10")).toBe(11);
    expect(ageFrom("2015-08-10", "2026-08-10")).toBe(11); // birthday today
    expect(ageFrom("2015-12-01", "2026-08-10")).toBe(10); // birthday still ahead
    expect(ageFrom("not-a-date", "2026-08-10")).toBeUndefined();
    expect(ageFrom(undefined, "2026-08-10")).toBeUndefined();
    expect(ageFrom("2030-01-01", "2026-08-10")).toBeUndefined(); // future DOB
    expect(ageFrom("2015-13-40", "2026-08-10")).toBeUndefined(); // impossible date
  });

  it("personLine is preferred name plus current age; the age simply drops without a DOB", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 10)); // Aug 10, 2026
    const card = deriveCard(snLetter(), "emergency");
    expect(card?.personLine).toBe("Bonnie, 11");

    const noDob = deriveCard(snLetter({ person: undefined }), "emergency");
    expect(noDob?.personLine).toBe("Bonnie");
  });

  it("footerMeta carries the letter's own date, not the download date", () => {
    const card = deriveCard(snLetter(), "emergency");
    expect(card?.footerMeta).toBe("Updated August 8, 2026 · Not a medical document");
  });

  it("fills {name} in the purpose line, with a neutral fallback", () => {
    const named = deriveCard(snLetter(), "identity");
    expect(named?.purpose).toBe("Who Bonnie is, who is responsible for them, and who to reach.");

    const anonymous = deriveCard(
      snLetter({
        gettingStarted: { subjectFullName: "", subjectPreferredName: "" },
      }),
      "meds"
    );
    // Identity needs a name, but meds does not — its purpose falls back.
    expect(anonymous?.purpose).toBe(
      "What this person takes, when, and what to do when they say no."
    );
  });

  it("the identity person block carries name, goes-by, birth date, and address", () => {
    const card = deriveCard(snLetter(), "identity");
    expect(card?.person?.name).toBe("Bonnie Marie Kelly");
    expect(card?.person?.sub).toBe("Goes by Bonnie · born January 15, 2015");
    expect(card?.person?.sub2).toBe("12 Maple Street, Rome, GA");
  });
});

/* --------------------------------------------------------- critical tone */

describe("critical blocks", () => {
  it("flags the export's pattern: allergies and call-911 on emergency, transitions on routine", () => {
    const emergency = deriveCard(snLetter(), "emergency");
    expect(block(emergency, "Allergies")?.tone).toBe("critical");
    expect(block(emergency, "Call 911")?.tone).toBe("critical");
    expect(block(emergency, "What to do")?.tone).toBeUndefined();

    const routine = deriveCard(snLetter(), "routine");
    expect(block(routine, "Between activities")?.tone).toBe("critical");

    const care = deriveCard(snLetter(), "care");
    expect(block(care, "Equipment")?.tone).toBe("critical");

    const agingCare = deriveCard(generalLetter(), "care");
    expect(block(agingCare, "Around the home")?.tone).toBe("critical");
  });

  it("enforceCriticalCap demotes the lowest-priority critical past two, keeping its content", () => {
    const blocks: CardBlock[] = [
      { label: "First", tone: "critical", lines: [{ v: "a" }] },
      { label: "Plain", lines: [{ v: "b" }] },
      { label: "Second", tone: "critical", lines: [{ v: "c" }] },
      { label: "Third", tone: "critical", lines: [{ v: "d" }] },
    ];
    const capped = enforceCriticalCap(blocks);
    expect(capped.map((b) => b.tone)).toEqual(["critical", undefined, "critical", undefined]);
    expect(capped[3].label).toBe("Third");
    expect(capped[3].lines).toEqual([{ v: "d" }]);
    // The originals are untouched — derivation stays side-effect free.
    expect(blocks[3].tone).toBe("critical");
  });
});
