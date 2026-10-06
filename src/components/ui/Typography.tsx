import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type HeadingLevel = "display" | "h1" | "h2" | "h3";

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Visual size. Defaults to "h2". */
  level?: HeadingLevel;
  /** Rendered element; defaults to match level ("display" renders h1). */
  as?: "h1" | "h2" | "h3" | "h4";
}

/** Serif editorial heading. */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level = "h2", as, className, ...props }, ref) => {
    const Tag = as ?? (level === "display" ? "h1" : level);
    return <Tag ref={ref} className={cn("ds-heading", `ds-heading--${level}`, className)} {...props} />;
  },
);
Heading.displayName = "Heading";

export type TextVariant = "body" | "lead" | "small" | "caption" | "strong";

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  /** Text style. Defaults to "body". */
  variant?: TextVariant;
}

/** Sans-serif body text in warm mauve. */
export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ variant = "body", className, ...props }, ref) => (
    <p ref={ref} className={cn("ds-text", `ds-text--${variant}`, className)} {...props} />
  ),
);
Text.displayName = "Text";
