import { forwardRef, type AnchorHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SiteHeaderProps extends HTMLAttributes<HTMLElement> {
  /** Brand content (wordmark or logo), shown on the left. */
  brand: ReactNode;
  /** Optional right-side actions, e.g. a Button. */
  actions?: ReactNode;
}

/** Sticky frosted-glass navigation bar. Pass NavLinks as children. */
export const SiteHeader = forwardRef<HTMLElement, SiteHeaderProps>(
  ({ brand, actions, className, children, ...props }, ref) => (
    <header ref={ref} className={cn("ds-header", className)} {...props}>
      <div className="ds-header__brand">{brand}</div>
      <nav className="ds-header__nav" aria-label="Main">
        {children}
        {actions}
      </nav>
    </header>
  ),
);
SiteHeader.displayName = "SiteHeader";

export interface NavLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Marks the current page (sets aria-current). */
  active?: boolean;
}

/** Navigation link for SiteHeader. */
export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(({ active, className, ...props }, ref) => (
  <a ref={ref} aria-current={active ? "page" : undefined} className={cn("ds-navlink", className)} {...props} />
));
NavLink.displayName = "NavLink";

export type DividerProps = HTMLAttributes<HTMLHRElement>;

/** Warm stone horizontal rule. */
export const Divider = forwardRef<HTMLHRElement, DividerProps>(({ className, ...props }, ref) => (
  <hr ref={ref} className={cn("ds-divider", className)} {...props} />
));
Divider.displayName = "Divider";
