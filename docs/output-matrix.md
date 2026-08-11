# Field → output matrix

Status: **PROPOSED — Checkpoint 1.** This is the contract: generators must
never invent a mapping that is not here, and after the re-architecture
`derive.ts` contains zero path conditionals — every row is data-driven
(present when the field has content), never path-driven.

**Outputs.** T = Letter of Intent (for the trustee) · C = Letter for the
Caregiver (new) · E = Emergency Information Sheet · K = Care Cards (one
derivation, two formats: phone PNG and print-at-home PDF).

**Marks.** P = primary (the output is built around it) · i = included ·
— = not used. Every canonical field appears in at least one output.

## The contract's three fixed defects

1. `E.protocol` reads `emergencyPlan.responseSteps`, falling back to
   `health.emergencyProtocol` — **never** `health.appointmentHelp`.
2. `E.insurance` reads `health.insurancePlans` (plan names) — **never**
   `health.recordsLocation`.
3. `E.triggers` reads `behavior.triggers` whenever it has content — never
   hardcoded absent for any configuration.

Each is covered by a regression test that fills the wrong-source field and
asserts it does NOT print under the trusted heading.

## Matrix

### gettingStarted
| Field | T | C | E | K |
| --- | --- | --- | --- | --- |
| authorName | i | i | — | — |
| authorRelationship | i | i | — | — |
| subjectFullName | i | i | P | P |
| subjectPreferredName | i | i | i | P |
| subjectAddress | — | — | — | P (Identity card only, owner-approved) |
| letterDate | i | i | i | i (freshness line on everything) |

### person
| Field | T | C | E | K |
| --- | --- | --- | --- | --- |
| dateOfBirth | i | i | P | i |
| whoTheyAre | P | P | — | — |
| history | P | i | — | — |
| temperament | i | P | — | — |
| firstFiveMinutes | i | P | — | — |
| strangersGetWrong | i | P | — | — |
| cannotAbide | i | P | — | i (Behavior card, enriches) |
| importantToKnow | i | i | — | — |

### familySupport
| Field | T | C | E | K |
| --- | --- | --- | --- | --- |
| contacts[] | i | i | P | P |
| firstCall | — | i | P | P |
| doNotInvolve | P | i | — | — (sensitive; letters only) |

### routine
| Field | T | C | E | K |
| --- | --- | --- | --- | --- |
| mornings | — | P | — | i (Routine card, legacy fallback) |
| evenings | — | P | — | i |
| sleep | — | P | — | i |
| food | — | P | — | i (Food card, legacy fallback) |
| clothing | — | P | — | — |
| sensory | — | P | — | — |
| comfortObjects | — | P | — | — |
| fixedPoints | — | P | — | i |
| gettingAround | — | P | — | — |
| goodDay | i | P | — | — |
| hardDay | — | P | — | — |

### communication
| Field | T | C | E | K |
| --- | --- | --- | --- | --- |
| how | — | P | P | P (Behavior card anchor: how OR howToSpeak) |
| howToSpeak | — | P | i | i |
| yesNo | — | P | i | i |
| hearingVisionMemory | — | P | i | i |
| pain | — | P | P | i |
| wontAdmit | — | P | i | — |
| overwhelm | — | P | — | — |
| hardConversations | — | P | — | — |
| whatHelps | — | P | i | i |
| whatToAvoid | — | P | i | i |

### health
| Field | T | C | E | K |
| --- | --- | --- | --- | --- |
| providers[] | i | i | — | P (Identity card) |
| medications[] | i | i | P | P (Meds + Emergency cards) |
| conditions | i | i | P | i |
| allergies (prose) | — | i | i (fallback under allergies.items) | i (legacy fallback) |
| pharmacy | i | P | — | — |
| preferredHospital | — | i | P | i |
| emergencyProtocol | — | i | P (fallback under emergencyPlan.responseSteps) | — |
| appointmentHelp | i | P | **never** | — |
| therapies | i | i | — | — |
| equipment | i | i | — | i (Care card, enriches) |
| insurancePlans | P | i | P ("Insurance" heading) | — |
| recordsLocation | i | i | — | — |
| whatWorked | i | i | — | — |
| whatDidNot | i | i | — | — |

### behavior
| Field | T | C | E | K |
| --- | --- | --- | --- | --- |
| triggers | — | P | P | P |
| earlyWarnings | — | P | — | i |
| deEscalation | — | P | P | P |
| makesWorse | — | P | P | i |
| crisisPlan | — | P | i | — |
| lawEnforcement | — | P | i | i (Behavior card, proposed addition) |

### home
| Field | T | C | E | K |
| --- | --- | --- | --- | --- |
| currentLiving | i | P | — | — |
| theHome | — | P | — | — |
| supportLevel | P | P | — | — |
| householdHelp | — | P | — | — |
| personalCare | — | P | — | i (Care card, legacy fallback) |
| petsAndPlants | — | P | — | — |
| deferred | — | P | — | — |
| safety | — | P | — | i (Care card, enriches) |
| waiverStatus | P | — | — | — |
| futureHopes | P | i | — | — |
| hardLimits | P | i | — | — |

### schoolWork
| Field | T | C | E | K |
| --- | --- | --- | --- | --- |
| currentProgram | i | P | — | — |
| iepHistory | i | i | — | — |
| whatWorksLearning | — | P | — | — |
| workHistory | i | i | — | — |
| currentWork | i | P | — | — |
| jobSupports | i | i | — | — |
| commitments | i | P | — | — |
| keyContacts | — | P | — | — |
| windDown | i | P | — | — |
| hopes | P | i | — | — |

### moneyBenefits (everything here is trustee-letter material at emergency-sheet strictness)
| Field | T | C | E | K |
| --- | --- | --- | --- | --- |
| programs | P | — | — | — |
| incomeSources | P | — | — | — |
| whoHandlesBills | P | i | — | — |
| howBillsArePaid | P | i | — | — |
| repPayee | P | — | — | — |
| ableAccount | P | — | — | — |
| trusts | P | — | — | — |
| pending | P | — | — | — |
| whereRecordsKept | P | i | — | — |
| vulnerabilities | P | i | — | — |

### legal
| Field | T | C | E | K |
| --- | --- | --- | --- | --- |
| powersOfAttorney | P | i | — | — |
| advanceDirectives | P | i | — | — |
| guardianship | P | — | — | — |
| whoDecidesWhat | P | i | — | — |
| decisionStatus (legacy) | i | i | — | — |
| advocates | i | i | — | — |
| advocacyHistory | P | — | — | — |
| professionals | P | — | — | — |

### communityFaith
| Field | T | C | E | K |
| --- | --- | --- | --- | --- |
| friends | i | P | — | — |
| activities | — | P | — | — |
| joy | i | P | — | — |
| faith | i | P | — | — |
| congregation | — | P | — | — |
| traditions | i | P | — | — |
| travel | — | P | — | — |

### trusteeGuidance / caregiverGuidance
| Field | T | C | E | K |
| --- | --- | --- | --- | --- |
| trusteeGuidance.* (all six) | P | — | — | — |
| caregiverGuidance.firstWeek, hindsight, neverChange, consultFirst | — | P | — | — |

### finalWishes / personalMessage
| Field | T | C | E | K |
| --- | --- | --- | --- | --- |
| finalWishes.* (all six) | P | i | — | — |
| personalMessage.toCaregivers | i | P | — | — |
| personalMessage.toSiblings | i | i | — | — |
| personalMessage.toPerson | i | i | — | — |

### Card-data sections
| Field | T | C | E | K |
| --- | --- | --- | --- | --- |
| allergies.items[] | — | i | P | P (Emergency card) |
| routines.items[] | — | i | — | P (Routine card) |
| routines.transitions | — | i | — | P |
| foods.items[] | — | i | — | P (Food card) |
| careTasks.items[] | — | i | — | P (Care card) |
| emergencyPlan.responseSteps | — | i | P | P |
| emergencyPlan.scenarios[] | — | i | i | P |
| emergencyPlan.call911When | — | i | P | P |
| emergencyPlan.otherwiseCall | — | i | i | P |
| emergencyPlan.ifNoOneAnswers | — | i | i | P |
| emergencyPlan.otcPolicy | — | i | — | P (Meds card closing rule) |

## Output-integrity check (per output)

- **T** — spine: trusteeGuidance ×6, moneyBenefits ×10, legal, hardLimits,
  supportLevel, waiverStatus, plus enough person/history to exercise judgment.
  No merge starved it: every money/benefits/authority field survived unmerged
  except whereRecordsKept ⇄ whereDocumentsKept (same question, verified).
- **C** — spine: routine, communication, behavior, health-daily,
  caregiverGuidance, home. All present; the merged whatHelps/whatToAvoid pair
  serves it with adaptive wording.
- **E** — every heading fed by a field that genuinely answers it (the three
  defect fixes above). Merges declined FOR this output:
  emergencyProtocol/appointmentHelp, insurancePlans/recordsLocation,
  pain/wontAdmit.
- **K** — highest bar. Merges declined for card reasons: none needed beyond
  E's list — every card-primary field survived unmerged. Card-bound merged
  fields (conditions, whatHelps, whatToAvoid, friends-type fields are not
  card-bound) — the only card-bound merges are conditions and the routine
  legacy fallbacks, each justified: both source questions answered the same
  card line. Concatenation overflow degrades to "see the full letter," never
  silent clipping.

## Care Cards print format (decision C — refined spec)

One derivation feeds two renderers:
1. **Phone PNGs** — the shipped 1080×1920 system, unchanged in format.
2. **Print PDF** (new, @react-pdf/renderer, dynamically imported):
   US Letter, each card face laid out at credit-card width in portrait
   (2.55in × 4.53in, the 9:16 face at wallet width) — 6 per sheet with crop
   marks, body text ≈ 9pt (above the legibility floor at reading distance);
   plus a 4×6 variant, 1 per sheet, ≈ 14pt, for the fridge and the binder.
   The brief's 3.5×2 landscape wallet card is **rejected**: it would need a
   third layout system and halves the type size the card design is built on.
   The static "Which Cards To Send" index card ships on the last sheet.
