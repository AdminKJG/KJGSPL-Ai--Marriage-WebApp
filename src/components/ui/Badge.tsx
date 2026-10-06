import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "default" | "rose" | "ink" | "outline";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Visual style. Defaults to "default" (blush tint). */
  variant?: BadgeVariant;
  /** Shows a decorative rose dot before the label. */
  dot?: boolean;
}

/** Pill badge / tag for status and categories. */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", dot = false, className, children, ...props }, ref) => (
    <span ref={ref} className={cn("ds-badge", `ds-badge--${variant}`, className)} {...props}>
      {dot && <span className="ds-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  ),
);
Badge.displayName = "Badge";
