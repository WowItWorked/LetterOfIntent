# DRAFT — AI Use statement

> ## ⚠️ NOT LEGAL ADVICE — DRAFT FOR ATTORNEY REVIEW
>
> Prepared by an automated auditor who is not a lawyer. For review by Claire
> Kelly, Esq. **Do not publish as-is.**

**Suggested placement:** a short section of `/privacy` (`#ai`), or of `/security`.
Not a page of its own — a whole page saying "we don't do this" is odd.

---

## Why this document exists

**Priority: P2 today. P0 the moment anyone proposes an AI feature.**

The codebase contains **no AI features of any kind** — I searched `src/` for
every obvious marker and found nothing. So there is nothing to disclose. That is
precisely why this is worth writing now: it costs nothing while it is free, and
it becomes very expensive to write later.

The pressure will arrive. *"Help me write this section"* is the most obvious
feature request this product has, and it would be genuinely useful — a blank page
is exactly what stops families from finishing. It is also the single clearest
violation of the canonical promise available: sending a parent's description of
their disabled child to a third-party model would mean *"Everything you type stays
on your device"* is simply no longer true.

**Legally required?** No. `[[Counsel: watch Colorado SB 24-205 and the EU AI Act
transparency provisions if an AI feature is ever added — neither bites on a
no-AI site.]]`

**What it protects against:** a feature shipping on a Tuesday that quietly
invalidates the site's central promise. A written commitment makes that a
decision someone must consciously reverse in public.

**Maintenance:** revisit whenever AI is proposed. That is the entire mechanism.

---

# Part A — For publication

## Artificial intelligence

**We do not use AI in this tool.**

Nothing you write is sent to an AI system, an assistant, or a language model. No
part of what you type is used to train anything. There is no chatbot, no
suggestion engine, and no automatic drafting. The questions and guidance you see
were written by people at Trusts & Wealth, PLLC.

We know it would be useful to have help with the blank page. We have deliberately
not built it, because every version of that feature we could build today would
mean sending your description of the person you love — their diagnosis, their
hard days, what frightens them — to a company that is not us.

**If we ever change this, we will say so here first, before it takes effect, and
we will say exactly what would be sent and where.** Any such feature would have
to run entirely on your own device, or we would not build it.

---

# Part B — Internal note. **DO NOT PUBLISH.**

## If an AI feature is ever proposed

Treat this as a hard gate, not a checklist.

**Any AI feature that sends letter content off the device is a fundamental change
to the product's central claim, not a feature addition.** It requires:

1. **A full PRIVACY IMPACT assessment** covering, at minimum:
   - What data would leave the device (in practice: a parent's free-text
     description of a disabled child's medical, behavioural, and psychological
     state).
   - To where, and who could access it — including the model provider's
     employees, its subprocessors, and anyone who serves it with legal process.
   - Whether it is opt-in, default-off, and revocable — noting that **opt-in does
     not cure the problem**, because the user cannot meaningfully consent on
     behalf of the disabled person the letter is about, who is often the one
     person in the transaction with no voice in it.
   - **What the core promise would have to be reworded to.** *"Everything you type
     stays on your device"* would have to go. There is no honest way to keep that
     sentence alongside a cloud model call, however narrowly scoped.
   - Breach and subpoena exposure created at the model provider. A special needs
     trust dispute, a custody matter, or a guardianship contest could each
     produce a subpoena aimed at exactly this data — and the whole point of the
     current architecture is that there is nothing to subpoena.
   - The client-side alternative considered, and why it is insufficient.
2. **Counsel review**, including a fresh COPPA analysis — see
   `childrens-information.md` Part B, Leg 3.
3. **A rewrite of `/privacy`, `/security`, and the header promise strip**, dated
   and recorded in the change log, published *before* the feature ships.

## Client-side alternatives that do not break anything

These get you most of the benefit at none of the cost, and should be exhausted
before any cloud option is discussed:

- **Better prompts and examples.** The reason a blank page is paralysing is
  usually that the question is too big. Smaller questions beat AI.
- **Worked examples from the existing sample documents**, shown inline beside the
  field, drawn from content already written and already shipped.
- **A local, on-device model** (WebGPU / WASM). Real but heavy: a multi-hundred-
  megabyte download on connections this audience often does not have, and a
  significant accessibility and performance cost. Honest assessment: probably not
  worth it for this audience today, but it is the only architecture that keeps
  the promise intact.
- **Templated sentence starters** — no model at all, just good writing offered as
  a scaffold the family edits. Cheapest, most reliable, and closest to what
  families actually need.

## And the thing to weigh it against

The brief for this audit set the bar as: *a parent sitting down at 11pm,
frightened, must be able to finish this document.* An AI assist would genuinely
help that parent finish.

That is a real argument and it deserves an honest hearing rather than a reflex
"no". But the governing hierarchy puts **Privacy above everything**, and the
promise at the top of every page is the reason many of these families trusted the
tool enough to start. **Helping someone finish by breaking the promise that made
them begin is not a trade worth making.** Solve the blank page with better
questions instead.
