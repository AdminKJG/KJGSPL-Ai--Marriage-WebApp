/** Join class names, skipping falsy values. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Format interest tags into human readable labels */
export function humanize(tag: string): string {
  return tag.replace(/^interest_/, "").replace(/_/g, " ");
}
