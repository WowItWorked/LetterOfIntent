"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  useFieldArray,
  useForm,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  RepeaterField,
  RepeaterItemField,
  RepeaterItemMultiselect,
  RepeaterItemSelect,
  ScalarField,
  SectionDef,
} from "@/lib/content/types";
import type { SectionKey } from "@/lib/schema";
import { fieldMarkerText } from "@/lib/cards/status";
import { DEFAULT_PATH, resolvePath } from "@/lib/content/paths";
import {
  defaultValuesForSection,
  displayName,
  emptyRepeaterItem,
  fillName,
  itemHasContent,
} from "@/lib/derive";
import { buildHintSchema } from "@/lib/validation";
import { useLetterStore } from "@/lib/store";
import { useSaveStatusStore } from "@/lib/save-status-store";
import {
  addCustomValue,
  optionLabel,
  repeaterItemSummary,
  toggleToken,
} from "@/components/wizard/repeater-logic";
import { Disclosure } from "@/components/ui/Disclosure";
import {
  describedBy,
  errMessage,
  FieldShell,
  inputClasses,
  textareaClasses,
} from "@/components/wizard/field-ui";

const AUTOSAVE_MS = 600;

export function SectionForm({ def }: { def: SectionDef }) {
  const data = useLetterStore((s) => s.data);
  const setSection = useLetterStore((s) => s.setSection);
  const letterPath = useLetterStore((s) => s.meta.letterPath);
  const setStatus = useSaveStatusStore((s) => s.setStatus);
  const name = displayName(data);
  // Markers are path-aware: the same field can feed different cards per path.
  const path = resolvePath(def.slug, letterPath ?? DEFAULT_PATH);

  // Initial values come from the store once (the form is the source of truth
  // while mounted; the component remounts per section via key={def.slug}).
  const defaults = useMemo(
    () => defaultValuesForSection(def, data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [def.slug]
  );
  const hintSchema = useMemo(() => buildHintSchema(def), [def]);

  // "onTouched": hints first appear when leaving a field, then clear live
  // while the user fixes them — gentle in both directions.
  const form = useForm<FieldValues>({
    defaultValues: defaults,
    resolver: zodResolver(hintSchema),
    mode: "onTouched",
  });

  const save = setSection as (key: SectionKey, values: unknown) => void;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    const sub = form.watch(() => {
      dirty.current = true;
      setStatus("pending");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        dirty.current = false;
        save(def.key, form.getValues());
        setStatus("saved");
      }, AUTOSAVE_MS);
    });
    return () => {
      sub.unsubscribe();
      if (timer.current) clearTimeout(timer.current);
      // Flush anything typed in the last moments before navigating away.
      if (dirty.current) {
        dirty.current = false;
        save(def.key, form.getValues());
        setStatus("saved");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def.key]);

  return (
    <form
      autoComplete="off"
      onSubmit={(e) => e.preventDefault()}
      aria-label={fillName(def.title, name)}
      className="space-y-7"
    >
      {def.fields.map((field) => {
        const marker = fieldMarkerText(path, def.key, field.id);
        return field.kind === "repeater" ? (
          <RepeaterControl key={field.id} field={field} form={form} name={name} marker={marker} />
        ) : (
          <ScalarControl key={field.id} field={field} form={form} name={name} marker={marker} />
        );
      })}
    </form>
  );
}

/* ------------------------------------------------------------------ scalars */

function ScalarControl({
  field,
  form,
  name,
  marker,
}: {
  field: ScalarField;
  form: UseFormReturn<FieldValues>;
  name: string;
  marker?: string;
}) {
  const id = `f-${field.id}`;
  const markerId = `${id}-card`;
  const helpId = `${id}-help`;
  const hintId = `${id}-hint`;
  const hint = errMessage(form.formState.errors, [field.id]);
  const label = fillName(field.label, name);
  const help = field.help ? fillName(field.help, name) : undefined;
  const placeholder = field.placeholder ? fillName(field.placeholder, name) : undefined;
  const example = field.example ? fillName(field.example, name) : undefined;
  const aria = describedBy(help && helpId, marker && markerId, hint && hintId);

  return (
    <FieldShell
      htmlFor={id}
      label={label}
      marker={marker}
      markerId={markerId}
      help={help}
      helpId={helpId}
      hint={hint}
      hintId={hintId}
      example={example}
    >
      {field.kind === "textarea" ? (
        <textarea
          id={id}
          rows={field.rows ?? 3}
          placeholder={placeholder}
          aria-describedby={aria}
          className={textareaClasses}
          {...form.register(field.id)}
        />
      ) : (
        <input
          id={id}
          type={field.kind === "tel" ? "text" : field.kind}
          inputMode={field.kind === "tel" ? "tel" : field.kind === "email" ? "email" : undefined}
          placeholder={placeholder}
          aria-describedby={aria}
          className={inputClasses}
          {...form.register(field.id)}
        />
      )}
    </FieldShell>
  );
}

/* ---------------------------------------------------------------- repeaters */

function RepeaterControl({
  field,
  form,
  name,
  marker,
}: {
  field: RepeaterField;
  form: UseFormReturn<FieldValues>;
  name: string;
  marker?: string;
}) {
  const { fields: items, append, remove } = useFieldArray({
    control: form.control,
    name: field.id,
  });
  // Live values drive the collapsed summaries, so a summary is never staler
  // than the record behind it.
  const liveValues =
    (form.watch(field.id) as Array<Record<string, unknown>> | undefined) ?? [];

  // Records that already say something start collapsed to their summary line;
  // blank records (including the seeded first one) start open, ready to type
  // into. Keyed by react-hook-form's per-item key; an unknown key — a freshly
  // added record — defaults to open.
  const [closed, setClosed] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    const values = form.getValues(field.id) as
      | Array<Record<string, unknown>>
      | undefined;
    items.forEach((it, i) => {
      const v = values?.[i];
      if (v && itemHasContent(v)) initial[it.id] = true;
    });
    return initial;
  });

  const label = fillName(field.label, name);
  const help = field.help ? fillName(field.help, name) : undefined;
  const noun = field.itemNoun;

  const mainFields = field.itemFields.filter((f) => f.group !== "more");
  const moreFields = field.itemFields.filter((f) => f.group === "more");

  const handleRemove = (index: number) => {
    const values = form.getValues(field.id) as Array<Record<string, unknown>> | undefined;
    const item = values?.[index];
    if (item && itemHasContent(item)) {
      const ok = window.confirm(
        `Remove this ${noun}? What you typed here will be removed. (The rest of the letter is untouched.)`
      );
      if (!ok) return;
    }
    remove(index);
    // Never zero records: removing the last one leaves a fresh blank in its
    // place, so the section always ends the way it began — with a form.
    if ((values?.length ?? 0) <= 1) append(emptyRepeaterItem(field));
  };

  return (
    <fieldset>
      <legend className="font-medium text-ink">{label}</legend>
      {/* Once for the whole group: SOURCES sends records to cards whole, so
          repeating the same line inside every record would only add noise. */}
      {marker ? <p className="mt-1 text-[0.8125rem] text-muted">{marker}</p> : null}
      {help ? <p className="mt-1 max-w-prose text-sm text-muted">{help}</p> : null}

      <div className="mt-3 space-y-4">
        {items.map((item, index) => {
          const isOpen = !closed[item.id];
          const summary = repeaterItemSummary(field, liveValues[index] ?? {});
          const panelId = `rp-${field.id}-${index}`;
          return (
            <div key={item.id} className="rounded-lg border border-line bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={isOpen ? panelId : undefined}
                  onClick={() =>
                    setClosed((prev) => ({ ...prev, [item.id]: isOpen }))
                  }
                  className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 text-left"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    className={`size-3.5 flex-none text-faint transition-transform motion-reduce:transition-none ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <path
                      d="M4 6l4 4 4-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  {isOpen || !summary ? (
                    <span className="text-sm font-semibold uppercase tracking-wide text-faint">
                      {noun} {index + 1}
                    </span>
                  ) : (
                    <span className="truncate text-[0.95rem] font-medium text-ink">
                      <span className="sr-only">
                        {noun} {index + 1}:{" "}
                      </span>
                      {summary}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="min-h-11 rounded-md px-2 text-sm font-medium text-danger underline-offset-4 hover:underline"
                >
                  Remove
                  <span className="sr-only">
                    {" "}
                    {noun} {index + 1}
                  </span>
                </button>
              </div>

              {isOpen ? (
                <div id={panelId} className="mt-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {mainFields.map((itemField) => (
                      <ItemFieldControl
                        key={itemField.id}
                        field={field}
                        itemField={itemField}
                        index={index}
                        form={form}
                        name={name}
                      />
                    ))}
                  </div>
                  {moreFields.length > 0 ? (
                    <Disclosure label="More details" className="mt-3">
                      <div className="grid gap-3 pt-1 sm:grid-cols-2">
                        {moreFields.map((itemField) => (
                          <ItemFieldControl
                            key={itemField.id}
                            field={field}
                            itemField={itemField}
                            index={index}
                            form={form}
                            name={name}
                          />
                        ))}
                      </div>
                    </Disclosure>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => append(emptyRepeaterItem(field))}
        className="mt-3 flex min-h-11 w-full items-center justify-center rounded-lg border border-dashed border-control font-medium text-accent hover:bg-goldtint"
      >
        + {fillName(field.addLabel, name)}
      </button>
    </fieldset>
  );
}

/* ------------------------------------------------------------- item fields */

function ItemFieldControl({
  field,
  itemField,
  index,
  form,
  name,
}: {
  field: RepeaterField;
  itemField: RepeaterItemField;
  index: number;
  form: UseFormReturn<FieldValues>;
  name: string;
}) {
  const path = `${field.id}.${index}.${itemField.id}`;
  const id = `f-${field.id}-${index}-${itemField.id}`;
  const spanClass = itemField.width === "half" ? "sm:col-span-1" : "sm:col-span-2";
  const helpId = `${id}-help`;
  const itemHelp = itemField.help ? fillName(itemField.help, name) : undefined;

  if (itemField.kind === "checkbox") {
    return (
      <div className={spanClass}>
        <label className="flex min-h-11 items-center gap-2.5 text-[0.95rem] text-body">
          <input
            type="checkbox"
            className="size-5 shrink-0 rounded border-control accent-[var(--navy)]"
            aria-describedby={describedBy(itemHelp && helpId)}
            {...form.register(path)}
          />
          {fillName(itemField.label, name)}
        </label>
        {itemHelp ? (
          <p id={helpId} className="text-sm text-muted">
            {itemHelp}
          </p>
        ) : null}
      </div>
    );
  }

  if (itemField.kind === "multiselect") {
    return (
      <MultiselectControl
        itemField={itemField}
        path={path}
        idBase={id}
        form={form}
        name={name}
        spanClass={spanClass}
      />
    );
  }

  if (itemField.kind === "select") {
    return (
      <SelectControl
        itemField={itemField}
        path={path}
        id={id}
        form={form}
        name={name}
        spanClass={spanClass}
      />
    );
  }

  const hint = errMessage(form.formState.errors, [field.id, index, itemField.id]);
  const hintId = `${id}-hint`;

  return (
    <div className={spanClass}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {fillName(itemField.label, name)}
      </label>
      {itemHelp ? (
        <p id={helpId} className="mt-0.5 text-sm text-muted">
          {itemHelp}
        </p>
      ) : null}
      <div className="mt-1">
        {itemField.kind === "textarea" ? (
          <textarea
            id={id}
            rows={3}
            placeholder={
              itemField.placeholder ? fillName(itemField.placeholder, name) : undefined
            }
            aria-describedby={describedBy(itemHelp && helpId, hint && hintId)}
            className={textareaClasses}
            {...form.register(path)}
          />
        ) : (
          <input
            id={id}
            type={itemField.kind === "email" ? "email" : "text"}
            inputMode={
              itemField.kind === "tel"
                ? "tel"
                : itemField.kind === "email"
                  ? "email"
                  : undefined
            }
            placeholder={
              itemField.placeholder ? fillName(itemField.placeholder, name) : undefined
            }
            aria-describedby={describedBy(itemHelp && helpId, hint && hintId)}
            className={inputClasses}
            {...form.register(path)}
          />
        )}
      </div>
      <div aria-live="polite">
        {hint ? (
          <p id={hintId} className="mt-1 flex gap-1.5 text-sm text-hint">
            <span aria-hidden="true">✻</span>
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ selects */

/**
 * A native <select>, styled like the text inputs. No custom dropdown: this
 * audience gets the platform control that already works with every screen
 * reader and every phone. A stored value outside the options (an older
 * backup, a newer app) is kept as an extra choice rather than dropped.
 */
function SelectControl({
  itemField,
  path,
  id,
  form,
  name,
  spanClass,
}: {
  itemField: RepeaterItemSelect;
  path: string;
  id: string;
  form: UseFormReturn<FieldValues>;
  name: string;
  spanClass: string;
}) {
  const helpId = `${id}-help`;
  const itemHelp = itemField.help ? fillName(itemField.help, name) : undefined;
  const current = form.watch(path) as string | undefined;
  const unknown =
    current && current.trim() && !itemField.options.some((o) => o.value === current)
      ? current
      : undefined;

  return (
    <div className={spanClass}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {fillName(itemField.label, name)}
      </label>
      {itemHelp ? (
        <p id={helpId} className="mt-0.5 text-sm text-muted">
          {itemHelp}
        </p>
      ) : null}
      <div className="mt-1">
        <select
          id={id}
          aria-describedby={describedBy(itemHelp && helpId)}
          className={inputClasses}
          {...form.register(path)}
        >
          <option value="">Choose one</option>
          {itemField.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          {unknown ? <option value={unknown}>{unknown}</option> : null}
        </select>
      </div>
    </div>
  );
}

/**
 * A checkbox group writing into one string[] — fieldset and legend, so a
 * screen reader announces the question with every box. Values typed into the
 * optional custom input (a clock time for the medication schedule) join the
 * same array and appear as checked entries that can be unchecked away.
 */
function MultiselectControl({
  itemField,
  path,
  idBase,
  form,
  name,
  spanClass,
}: {
  itemField: RepeaterItemMultiselect;
  path: string;
  idBase: string;
  form: UseFormReturn<FieldValues>;
  name: string;
  spanClass: string;
}) {
  const raw = form.watch(path) as string[] | undefined;
  const values = Array.isArray(raw) ? raw : [];
  const [draft, setDraft] = useState("");
  const itemHelp = itemField.help ? fillName(itemField.help, name) : undefined;

  const setValues = (next: string[]) =>
    form.setValue(path, next, { shouldDirty: true, shouldTouch: true });

  const customs = values.filter((v) => !itemField.options.some((o) => o.value === v));

  const addDraft = () => {
    const next = addCustomValue(itemField, values, draft);
    if (next.length !== values.length) setValues(next);
    setDraft("");
  };

  const customInputId = `${idBase}-custom`;

  return (
    <fieldset className={`m-0 min-w-0 border-0 p-0 ${spanClass}`}>
      <legend className="p-0 text-sm font-medium text-ink">
        {fillName(itemField.label, name)}
      </legend>
      {itemHelp ? <p className="mt-0.5 text-sm text-muted">{itemHelp}</p> : null}
      <div className="mt-1 flex flex-wrap gap-x-5">
        {itemField.options.map((o) => (
          <label
            key={o.value}
            className="flex min-h-11 items-center gap-2.5 text-[0.95rem] text-body"
          >
            <input
              type="checkbox"
              className="size-5 shrink-0 rounded border-control accent-[var(--navy)]"
              checked={values.includes(o.value)}
              onChange={() => setValues(toggleToken(itemField, values, o.value))}
            />
            {o.label}
          </label>
        ))}
        {customs.map((v) => (
          <label
            key={v}
            className="flex min-h-11 items-center gap-2.5 text-[0.95rem] text-body"
          >
            <input
              type="checkbox"
              className="size-5 shrink-0 rounded border-control accent-[var(--navy)]"
              checked
              onChange={() => setValues(toggleToken(itemField, values, v))}
            />
            {optionLabel(itemField.options, v)}
          </label>
        ))}
      </div>
      {itemField.custom ? (
        <div className="mt-1.5 flex flex-wrap items-end gap-2.5">
          <div className="min-w-[11rem] flex-1">
            <label htmlFor={customInputId} className="block text-sm font-medium text-ink">
              {itemField.custom.label}
            </label>
            <div className="mt-1">
              <input
                id={customInputId}
                type="text"
                placeholder={itemField.custom.placeholder}
                className={inputClasses}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  // Enter adds the time; it must never fall through to a form
                  // submit that would scroll a tired person back to the top.
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDraft();
                  }
                }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={addDraft}
            className="min-h-11 rounded-[var(--radius-sm)] border border-control px-3.5 text-sm font-medium text-accent hover:bg-goldtint"
          >
            {itemField.custom.addLabel}
          </button>
        </div>
      ) : null}
    </fieldset>
  );
}
