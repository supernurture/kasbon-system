import { twMerge } from "tailwind-merge";

/** Joins class names; when two Tailwind classes clash (e.g. text-sm + text-base), the last one wins. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes.filter(Boolean).join(" "));
}
