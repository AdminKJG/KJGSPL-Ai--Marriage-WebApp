import { Link } from "@tanstack/react-router";

interface BrandLogoProps {
  to?: string;
  size?: "sm" | "md" | "lg";
  dark?: boolean;
  className?: string;
}

const LOGO_HEIGHTS: Record<"sm" | "md" | "lg", string> = {
  sm: "38px",
  md: "46px",
  lg: "56px",
};

export function BrandLogo({ to = "/", size = "md", dark = false, className = "" }: BrandLogoProps) {
  const height = LOGO_HEIGHTS[size] || LOGO_HEIGHTS.md;

  const content = (
    <span className={`brand-lockup brand-lockup--${size} ${dark ? "brand-lockup--dark" : ""} ${className}`.trim()}>
      <img
        src="/assets/ai_marriage_logo.png"
        alt="AI Marriage"
        className="brand-logo-img"
        style={{
          height,
          width: "auto",
          maxHeight: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
    </span>
  );

  if (to) {
    return (
      <Link to={to} className="brand-link" style={{ display: "inline-flex", alignItems: "center" }}>
        {content}
      </Link>
    );
  }

  return content;
}

