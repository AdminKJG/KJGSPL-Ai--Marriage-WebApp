import { forwardRef, useState, type InputHTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Badge } from "./Badge";
import { Card } from "./Card";
import { Heading, Text } from "./Typography";
import { Input, Label } from "./Form";
import { NavLink } from "./SiteHeader";
import type { Profile } from "@/lib/api/types";
import { getProfilePhotoUrl, photoUrl } from "@/lib/api/client";
import { humanize } from "@/lib/cn";

export function AppNavLink({ to, children }: { to: string; children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <NavLink
      href={to}
      active={pathname === to || pathname.startsWith(`${to}/`)}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        navigate({ to });
      }}
    >
      {children}
    </NavLink>
  );
}

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  action?: ReactNode;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(({ id, label, error, action, style, ...props }, ref) => (
  <div className="ds-field">
    <Label htmlFor={id}>{label}</Label>
    <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
      <Input
        id={id}
        ref={ref}
        invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        style={{ ...style, ...(action ? { paddingRight: "2.75rem" } : {}) }}
        {...props}
      />
      {action && (
        <div
          style={{
            position: "absolute",
            right: "0.625rem",
            top: "50%",
            transform: "translateY(-50%)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
            pointerEvents: "auto",
          }}
        >
          {action}
        </div>
      )}
    </div>
    {error && (
      <p className="ds-field__hint ds-field__hint--error" id={`${id}-err`} role="alert">{error}</p>
    )}
  </div>
));
Field.displayName = "Field";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div className="stack-2">
        <Heading level="h1">{title}</Heading>
        {subtitle && <Text variant="lead">{subtitle}</Text>}
      </div>
      {actions && <div className="row-3">{actions}</div>}
    </div>
  );
}

export function StateMessage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Card variant="surface">
      <div className="stack-2">
        <Heading level="h3">{title}</Heading>
        {children && <Text>{children}</Text>}
      </div>
    </Card>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  return (
    <StateMessage title="Couldn't load this">
      {error instanceof Error ? error.message : "Please try again in a moment."}
    </StateMessage>
  );
}

export function LoadingState({ count = 2 }: { count?: number }) {
  return (
    <div className="stack-3" role="status" aria-label="Loading content" style={{ width: "100%" }}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} variant="surface">
          <div className="stack-3" style={{ opacity: 0.65 }}>
            <div
              style={{
                height: "1.25rem",
                width: "40%",
                backgroundColor: "var(--border, #e5e7eb)",
                borderRadius: "0.375rem",
                animation: "pulse 1.5s infinite ease-in-out",
              }}
            />
            <div
              style={{
                height: "0.875rem",
                width: "75%",
                backgroundColor: "var(--border, #e5e7eb)",
                borderRadius: "0.25rem",
                animation: "pulse 1.5s infinite ease-in-out",
              }}
            />
            <div
              style={{
                height: "0.875rem",
                width: "55%",
                backgroundColor: "var(--border, #e5e7eb)",
                borderRadius: "0.25rem",
                animation: "pulse 1.5s infinite ease-in-out",
              }}
            />
          </div>
        </Card>
      ))}
    </div>
  );
}


export function TagList({ tags, variant = "default" }: { tags?: string[]; variant?: "default" | "rose" | "outline" }) {
  if (!tags?.length) return null;
  return (
    <div className="row-2 wrap">
      {tags.map((t) => (
        <Badge key={t} variant={variant}>
          {humanize(t)}
        </Badge>
      ))}
    </div>
  );
}

export function Avatar({ profile, large }: { profile: Profile; large?: boolean }) {
  const [hasError, setHasError] = useState(false);
  const src = getProfilePhotoUrl(profile);
  const name = profile.name?.trim() || "?";
  const initial = name[0]?.toUpperCase() || "?";

  return (
    <div className={large ? "avatar avatar--lg" : "avatar"} aria-hidden={!src || hasError}>
      {src && !hasError ? (
        <img
          src={src}
          alt={`Photo of ${name}`}
          onError={() => setHasError(true)}
          loading="lazy"
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

export function ProfileSummary({ profile }: { profile: Profile }) {
  const name = profile.name?.trim() || "Member";
  const meta = [profile.age && `${profile.age}`, profile.city, profile.occupation].filter(Boolean).join(" · ");
  return (
    <div className="row-3" style={{ alignItems: "center" }}>
      <Avatar profile={profile} />
      <div className="stack-1" style={{ minWidth: 0, flex: 1 }}>
        <Heading level="h3" as="h3" style={{ margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {name}
        </Heading>
        {meta && <Text variant="small" style={{ margin: 0, color: "var(--muted-foreground, #666)" }}>{meta}</Text>}
      </div>
    </div>
  );
}
