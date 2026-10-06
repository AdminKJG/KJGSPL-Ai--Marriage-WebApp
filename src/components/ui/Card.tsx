import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type CardVariant = "default" | "surface" | "glass";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Surface style. Defaults to "default". */
  variant?: CardVariant;
  /** Lifts on hover — use for clickable bento tiles. */
  interactive?: boolean;
}

/** Rounded content container for bento grids and panels. */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", interactive = false, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("ds-card", `ds-card--${variant}`, interactive && "ds-card--interactive", className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";
