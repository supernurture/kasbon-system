import type { ReactNode } from "react";

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
};

export function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs text-ink/70">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-accent-700">
          {error}
        </p>
      )}
      {hint}
    </div>
  );
}
