type SegmentedControlProps<T extends string> = {
  name: string;
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
};

/** Radio group styled as joined buttons: arrow keys and screen readers work out of the box. */
export function SegmentedControl<T extends string>({
  name,
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    // min-w-0: a fieldset defaults to min-content width and would overflow a narrow grid cell.
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-xs text-ink/70">{label}</legend>
      <div className="flex border border-divider">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-10 flex-1 cursor-pointer items-center justify-center px-2 text-[13px] whitespace-nowrap not-first:border-l not-first:border-divider not-has-checked:hover:bg-ink/7 has-checked:bg-accent has-checked:text-bg has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-accent md:min-h-9 md:px-3"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
