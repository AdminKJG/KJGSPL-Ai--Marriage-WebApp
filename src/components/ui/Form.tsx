import { forwardRef, type InputHTMLAttributes, type LabelHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

/** Form label — always pair with htmlFor. */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <label ref={ref} className={cn("ds-label", className)} {...props} />
));
Label.displayName = "Label";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Marks the field invalid (sets aria-invalid). */
  invalid?: boolean;
}

/** Text input on ivory surface. */
export const Input = forwardRef<HTMLInputElement, InputProps>(({ invalid, className, ...props }, ref) => (
  <input ref={ref} aria-invalid={invalid || undefined} className={cn("ds-input", className)} {...props} />
));
Input.displayName = "Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Marks the field invalid (sets aria-invalid). */
  invalid?: boolean;
}

/** Multi-line text input. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ invalid, className, ...props }, ref) => (
  <textarea ref={ref} aria-invalid={invalid || undefined} className={cn("ds-textarea", className)} {...props} />
));
Textarea.displayName = "Textarea";
