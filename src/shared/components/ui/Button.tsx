import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

const variants = {
  primary: "border-transparent bg-accent text-bg hover:bg-accent-600 active:bg-accent-700",
  secondary: "border-divider hover:bg-ink/7 active:bg-ink/14",
  ghost: "border-transparent text-accent hover:bg-accent/10 active:bg-accent/18",
  plain: "border-transparent hover:bg-ink/7",
} as const;

type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof variants;
  iconOnly?: boolean;
};

export function Button({
  variant = "secondary",
  iconOnly = false,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center gap-1.5 border text-sm leading-tight font-extrabold transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        iconOnly ? "w-11 justify-center p-0" : "justify-start px-4",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
