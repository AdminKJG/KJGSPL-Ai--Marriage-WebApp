import { Link } from "@tanstack/react-router";

interface BrandLogoProps {
  to?: string;
  size?: "sm" | "md" | "lg";
  dark?: boolean;
  className?: string;
}

export function BrandLogo({ to = "/", size = "md", dark = false, className = "" }: BrandLogoProps) {
  const content = (
    <span className={`brand-lockup brand-lockup--${size} ${dark ? "brand-lockup--dark" : ""} ${className}`.trim()}>
      <span className="brand-lockup__icon" aria-hidden="true">
        <svg
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M32 45 17 30C7 15 27 9 32 22c5-13 25-7 15 8Z" />
        </svg>
      </span>
      <span className="brand-lockup__text">
        ai marriage<span className="brand-lockup__dot">.</span>
      </span>
    </span>
  );

  if (to) {
    return (
      <Link to={to} className="brand-link">
        {content}
      </Link>
    );
  }

  return content;
}
