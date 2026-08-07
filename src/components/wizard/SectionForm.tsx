"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  useFieldArray,
  useForm,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldDef, RepeaterField, ScalarField, SectionDef } from "@/lib/content/types";
import type { SectionKey } from "@/lib/schema";
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
  const setStatus = useSaveStatusStore((s) => s.setStatus);
  const name = displayName(data);

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
      {def.fields.map((field) =>
        field.kind === "repeater" ? (
          <RepeaterControl key={field.id} field={field} form={form} name={name} />
        ) : (
          <ScalarControl key={field.id} field={field} form={form} name={name} />
        )
      )}
    </form>
  );
}

/* ------------------------------------------------------------------ scalars */

function ScalarControl({
  field,
  form,
  name,
}: {
  field: ScalarField;
  form: UseFormReturn<FieldValues>;
  name: string;
}) {
  const id = `f-${field.id}`;
  const helpId = `${id}-help`;
  const hintId = `${id}-hint`;
  const hint = errMessage(form.formState.errors, [field.id]);
  const label = fillName(field.label, name);
  const help = field.help ? fillName(field.help, name) : undefined;
  const placeholder = field.placeholder ? fillName(field.placeholder, name) : undefined;
  const example = field.example ? fillName(field.example, name) : undefined;
  const aria = describedBy(help && helpId, hint && hintId);

  return (
    <FieldShell
      htmlFor={id}
      label={label}
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
}: {
  field: RepeaterField;
  form: UseFormReturn<FieldValues>;
  name: string;
}) {
  const { fields: items, append, remove } = useFieldArray({
    control: form.control,
    name: field.id,
  });
  const label = fillName(field.label, name);
  const help = field.help ? fillName(field.help, name) : undefined;
  const noun = field.itemNoun;

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
  };

  return (
    <fieldset>
      <legend className="font-medium text-ink">{label}</legend>
      {help ? <p className="mt-1 max-w-prose text-sm text-muted">{help}</p> : null}

      <div className="mt-3 space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-faint">
            Nothing here yet — add the first {noun} whenever you're ready.
          </p>
        ) : null}
        {items.map((item, index) => (
          <div key={item.id} className="rounded-lg border border-line bg-surface p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold uppercase tracking-wide text-faint">
                {noun} {index + 1}
              </span>
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
            <div className="grid gap-3 sm:grid-cols-2">
              {field.itemFields.map((itemField) => {
                const path = `${field.id}.${index}.${itemField.id}`;
                const id = `f-${field.id}-${index}-${itemField.id}`;
                const spanClass =
                  itemField.width === "half" ? "sm:col-span-1" : "sm:col-span-2";

                if (itemField.kind === "checkbox") {
                  return (
                    <label
                      key={itemField.id}
                      className={`flex min-h-11 items-center gap-2.5 text-[0.95rem] text-body ${spanClass}`}
                    >
                      <input
                        type="checkbox"
                        className="size-5 shrink-0 rounded border-control accent-[var(--navy)]"
                        {...form.register(path)}
                      />
                      {fillName(itemField.label, name)}
                    </label>
                  );
                }

                const hint = errMessage(form.formState.errors, [
                  field.id,
                  index,
                  itemField.id,
                ]);
                const hintId = `${id}-hint`;
                const helpId = `${id}-help`;
                const itemHelp = itemField.help ? fillName(itemField.help, name) : undefined;

                return (
                  <div key={itemField.id} className={spanClass}>
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
                          rows={2}
                          placeholder={
                            itemField.placeholder
                              ? fillName(itemField.placeholder, name)
                              : undefined
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
                            itemField.placeholder
                              ? fillName(itemField.placeholder, name)
                              : undefined
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
              })}
            </div>
          </div>
        ))}
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
