"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, X } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Button } from "@/shared/components/ui/Button";
import { Dialog } from "@/shared/components/ui/Dialog";
import { Field } from "@/shared/components/ui/Field";
import { Input, inputClass } from "@/shared/components/ui/Input";
import { cn } from "@/shared/lib/cn";
import { formatNumber, todayISO } from "@/shared/lib/format";
import {
  debtInputSchema,
  MAX_AMOUNT,
  MAX_NAME_LENGTH,
  MAX_NOTE_LENGTH,
  type DebtInput,
} from "../schemas";
import type { Debt } from "../types";

const MAX_AMOUNT_DIGITS = String(MAX_AMOUNT).length;

const TYPE_OPTIONS = [
  { value: "owed_to_me", label: "Saya dihutang", hint: "Dia pinjam ke aku" },
  { value: "i_owe", label: "Saya hutang", hint: "Aku pinjam ke dia" },
] as const;

type DebtFormDialogProps = {
  /** null = closed, "new" = create, Debt = edit that entry. */
  target: Debt | "new" | null;
  onClose: () => void;
  /** Resolves to null on success, or an error message to show in the form. */
  onSave: (input: DebtInput, existing: Debt | null) => Promise<string | null>;
};

export function DebtFormDialog({ target, onClose, onSave }: DebtFormDialogProps) {
  return (
    <Dialog open={target !== null} onClose={onClose} variant="drawer" labelledBy="debt-form-title">
      {target && (
        <DebtForm
          key={target === "new" ? "new" : target.id}
          existing={target === "new" ? null : target}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Dialog>
  );
}

function toFormValues(debt: Debt | null): DebtInput {
  if (!debt) {
    return { type: "owed_to_me", counterpart_name: "", amount: 0, due_date: todayISO(), note: "" };
  }
  return {
    type: debt.type,
    counterpart_name: debt.counterpart_name,
    amount: debt.amount,
    due_date: debt.due_date ?? todayISO(),
    note: debt.note ?? "",
  };
}

type DebtFormProps = {
  existing: Debt | null;
  onClose: () => void;
  onSave: DebtFormDialogProps["onSave"];
};

function DebtForm({ existing, onClose, onSave }: DebtFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DebtInput>({
    resolver: zodResolver(debtInputSchema),
    defaultValues: toFormValues(existing),
  });

  const noteLength = useWatch({ control, name: "note" })?.length ?? 0;

  const onSubmit = handleSubmit(async (values) => {
    const error = await onSave(values, existing);
    if (error) setError("root.server", { message: error });
    else onClose();
  });

  const errorProps = (name: keyof DebtInput) => ({
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex h-full flex-col">
      <div className="flex items-center border-b-2 border-divider py-2 pr-2 pl-4 md:py-5 md:pr-4 md:pl-6">
        <h2 id="debt-form-title" className="flex-1 text-xl md:text-[22px]">
          {existing ? "Edit catatan" : "Catat baru"}
        </h2>
        <Button variant="plain" iconOnly onClick={onClose} aria-label="Tutup">
          <X size={20} aria-hidden />
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-4.5 overflow-y-auto px-4 py-5 md:gap-5 md:p-6">
        <fieldset>
          <legend className="mb-1.5 text-xs text-ink/70">Tipe</legend>
          <div className="grid grid-cols-2 border border-divider">
            {TYPE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex min-h-14 cursor-pointer items-start gap-2 p-3 text-sm leading-snug not-first:border-l not-first:border-divider has-checked:bg-surface"
              >
                <input
                  type="radio"
                  value={option.value}
                  className="peer sr-only"
                  {...register("type")}
                />
                <span
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 rounded-full border-[1.5px] border-divider peer-checked:border-accent peer-checked:bg-accent peer-checked:shadow-[inset_0_0_0_4px_var(--color-bg)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
                />
                <span>
                  <b className="whitespace-nowrap">{option.label}</b>
                  <span className="block text-xs text-neutral-700">{option.hint}</span>
                </span>
              </label>
            ))}
          </div>
          {errors.type && (
            <p role="alert" className="mt-1.5 text-xs text-accent-700">
              {errors.type.message}
            </p>
          )}
        </fieldset>

        <Field id="counterpart_name" label="Nama orang *" error={errors.counterpart_name?.message}>
          <Input
            id="counterpart_name"
            placeholder="Misal: Budi"
            autoComplete="off"
            maxLength={MAX_NAME_LENGTH}
            {...errorProps("counterpart_name")}
            {...register("counterpart_name")}
          />
        </Field>

        <Field id="amount" label="Jumlah *" error={errors.amount?.message}>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-neutral-700">
              Rp
            </span>
            <Controller
              control={control}
              name="amount"
              render={({ field }) => (
                <Input
                  id="amount"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0"
                  className="pl-8.5 font-semibold tabular-nums"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value ? formatNumber(field.value) : ""}
                  onChange={(event) => {
                    // Rupiah is whole numbers: keep digits only, so "1.250.000" and "1250000" agree.
                    const digits = event.target.value
                      .replace(/\D/g, "")
                      .slice(0, MAX_AMOUNT_DIGITS);
                    field.onChange(Number(digits || "0"));
                  }}
                  {...errorProps("amount")}
                />
              )}
            />
          </div>
        </Field>

        <Field id="due_date" label="Tanggal" error={errors.due_date?.message}>
          <Input id="due_date" type="date" {...errorProps("due_date")} {...register("due_date")} />
        </Field>

        <Field
          id="note"
          label="Catatan (opsional)"
          error={errors.note?.message}
          hint={
            <p className="mt-1 text-right text-[11px] text-neutral-600">
              {noteLength}/{MAX_NOTE_LENGTH}
            </p>
          }
        >
          <textarea
            id="note"
            rows={3}
            maxLength={MAX_NOTE_LENGTH}
            placeholder="Buat apa? Misal: patungan makan"
            className={cn(inputClass, "min-h-22 resize-y")}
            {...errorProps("note")}
            {...register("note")}
          />
        </Field>
      </div>

      {errors.root?.server && (
        <p
          role="alert"
          className="mx-4 mb-3 flex items-center gap-2 bg-accent-100 px-3 py-2.5 text-[13px] text-accent-800 md:mx-6"
        >
          <AlertCircle size={16} className="shrink-0" aria-hidden />
          {errors.root.server.message}
        </p>
      )}

      <div className="flex gap-2 border-t-2 border-ink px-4 pt-3 pb-5 md:border-divider md:px-6 md:py-4">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="min-h-13 flex-1 text-base md:min-h-12 md:text-sm"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" aria-hidden />}
          {existing ? "Simpan perubahan" : "Simpan catatan"}
        </Button>
        <Button onClick={onClose} className="min-h-12 max-md:hidden">
          Batal
        </Button>
      </div>
    </form>
  );
}
