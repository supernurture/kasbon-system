import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

export const inputClass =
  "w-full min-h-11 border border-divider bg-surface px-2.5 py-1.5 text-base text-ink caret-accent hover:border-ink/45 focus-visible:border-accent focus-visible:outline-offset-0 aria-invalid:border-accent md:text-sm";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClass, className)} {...props} />;
}
