import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

type AuthVariant = "login" | "register" | "forgot";

const HEADLINES: Record<
  AuthVariant,
  { title: string; subtitle: string; quote: string; author: string }
> = {
  register: {
    title: "Find your true counterpart.",
    subtitle: "Intelligent matching built on shared values, personality, and lifelong intent.",
    quote: "A thoughtful space where we felt genuinely known, not just filtered.",
    author: "Divya & Kabir — Matched in Pune",
  },
  login: {
    title: "Welcome back to your journey.",
    subtitle: "Continue connecting with verified members matched for your personality and vision.",
    quote: "Calm and intentional from day one. No endless swiping, just meaningful introductions.",
    author: "Meera & Arjun — Matched in Jaipur",
  },
  forgot: {
    title: "Reset your account access.",
    subtitle: "Enter your email to receive a secure password reset link.",
    quote: "Your privacy and profile security remain our highest priority.",
    author: "AI Marriage Trust & Safety",
  },
};

export function AuthLayout({
  variant,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  variant: AuthVariant;
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const content = HEADLINES[variant];

  return (
    <main className="auth-stage">
      {/* Soft ambient background shapes */}
      <div className="auth-stage__bg" aria-hidden="true">
        <span className="auth-stage__ring auth-stage__ring--a" />
        <span className="auth-stage__ring auth-stage__ring--b" />
        <span className="auth-stage__blob" />
      </div>

      {/* Main Two-Panel Card */}
      <div className="auth-split auth-enter" key={variant}>
        {/* LEFT PANEL: Clean & Luxurious Brand Showcase */}
        <section
          className="auth-visual"
          style={{
            background: "linear-gradient(150deg, #240d14 0%, #38121c 50%, #15060a 100%)",
            color: "#ffffff",
            padding: "clamp(2.5rem, 6vh, 4.5rem) clamp(2.5rem, 5vw, 5rem)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          {/* Subtle Warm Amber Glow Behind Logo */}
          <div
            style={{
              position: "absolute",
              top: "-40px",
              left: "10px",
              width: "380px",
              height: "280px",
              background: "radial-gradient(circle, rgba(234, 88, 12, 0.32) 0%, rgba(216, 137, 121, 0.12) 65%, transparent 80%)",
              filter: "blur(40px)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "clamp(1.5rem, 3vh, 2.5rem)" }}>
            {/* 1. Official AI Marriage Brand Logo */}
            <Link to="/" style={{ display: "inline-block", width: "fit-content", textDecoration: "none" }}>
              <img
                src="/assets/ai_marriage_logo.png"
                alt="AI Marriage Logo"
                style={{
                  height: "clamp(70px, 8.5vh, 88px)",
                  width: "auto",
                  objectFit: "contain",
                  filter: "drop-shadow(0 8px 24px rgba(0, 0, 0, 0.55))",
                }}
              />
            </Link>

            {/* 2. Platform Headline & Value Proposition (Concise & Minimal) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  background: "rgba(234, 88, 12, 0.18)",
                  border: "1px solid rgba(234, 88, 12, 0.35)",
                  color: "#fed7aa",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  width: "fit-content",
                }}
              >
                <span>✨</span>
                <span>AI-Powered Matrimony</span>
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: "clamp(1.75rem, 2.8vw, 2.4rem)",
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: "#fff9f2",
                  letterSpacing: "-0.01em",
                }}
              >
                {content.title}
              </h2>

              <p
                style={{
                  margin: 0,
                  fontSize: "clamp(0.95rem, 1.1vw, 1.05rem)",
                  lineHeight: 1.55,
                  color: "rgba(255, 249, 242, 0.8)",
                  maxWidth: "28rem",
                }}
              >
                {content.subtitle}
              </p>
            </div>

            {/* 3. Sleek 3 Single-Line Trust Pills */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
                marginTop: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.65rem 1rem",
                  borderRadius: "0.75rem",
                  background: "rgba(255, 249, 242, 0.06)",
                  border: "1px solid rgba(255, 249, 242, 0.12)",
                  color: "#fff9f2",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  width: "fit-content",
                }}
              >
                <span style={{ color: "#f59e0b" }}>✦</span>
                <span>AI Psychological & Values Match</span>
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.65rem 1rem",
                  borderRadius: "0.75rem",
                  background: "rgba(255, 249, 242, 0.06)",
                  border: "1px solid rgba(255, 249, 242, 0.12)",
                  color: "#fff9f2",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  width: "fit-content",
                }}
              >
                <span style={{ color: "#10b981" }}>🛡️</span>
                <span>100% Verified Members Only</span>
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.65rem 1rem",
                  borderRadius: "0.75rem",
                  background: "rgba(255, 249, 242, 0.06)",
                  border: "1px solid rgba(255, 249, 242, 0.12)",
                  color: "#fff9f2",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  width: "fit-content",
                }}
              >
                <span style={{ color: "#f43f5e" }}>🔒</span>
                <span>Private & Mutual Consent First</span>
              </div>
            </div>
          </div>

          {/* 4. Bottom Member Story Quote (Compact & Clean) */}
          <div style={{ position: "relative", zIndex: 1, marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(255, 249, 242, 0.12)" }}>
            <p style={{ margin: 0, fontSize: "0.88rem", fontStyle: "italic", color: "rgba(255, 249, 242, 0.88)", lineHeight: 1.5 }}>
              “{content.quote}”
            </p>
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem", fontWeight: 600, color: "#fed7aa" }}>
              {content.author}
            </p>
          </div>
        </section>

        {/* RIGHT PANEL: Authentication Form */}
        <section className="auth-panel">
          <div className="auth-panel__inner">
            <div className="auth-panel__mobile-brand" style={{ textAlign: "center", marginBottom: "0.75rem" }}>
              <img
                src="/assets/ai_marriage_logo.png"
                alt="AI Marriage Logo"
                style={{ height: "46px", width: "auto", objectFit: "contain" }}
              />
            </div>

            <p className="ds-text--caption auth-eyebrow auth-rise-1" key={`e-${variant}`}>
              {eyebrow}
            </p>
            <h1 className="auth-title auth-slide-r" key={`t-${variant}`}>
              {title}
            </h1>
            <p className="auth-subtitle auth-rise-2" key={`s-${variant}`}>
              {subtitle}
            </p>

            <div className="auth-form auth-rise-3" key={`f-${variant}`}>
              {children}
            </div>

            <p className="auth-secure">
              🛡️ Profiles are manually reviewed. Photos and personal details remain strictly private until approved.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
