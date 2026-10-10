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
    author: "",
  },
  login: {
    title: "Find Your Perfect Match",
    subtitle: "Continue connecting with verified members matched for your personality and vision.",
    quote: "Calm and intentional from day one. No endless swiping, just meaningful introductions.",
    author: "",
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
  eyebrow?: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const content = HEADLINES[variant];

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .auth-container {
          display: flex;
          min-height: 100vh;
          width: 100%;
          background: #ffffff;
          font-family: var(--font-sans, system-ui, sans-serif);
        }
        .auth-left {
          flex: 1;
          display: none;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          padding: 3rem 2.5rem;
          background: linear-gradient(135deg, #1f0b11 0%, #3d1421 50%, #17070b 100%);
          color: white;
          position: relative;
          overflow: hidden;
          text-align: center;
        }
        @media (min-width: 900px) {
          .auth-left { display: flex; }
        }
        .auth-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 1rem;
          background: #ffffff;
          position: relative;
        }
        @media (min-width: 900px) {
          .auth-right { padding: 4rem; max-width: 600px; margin: 0 auto; }
        }
        .auth-glow {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 80%; height: 80%;
          background: radial-gradient(circle, rgba(225,29,72,0.15) 0%, transparent 70%);
          filter: blur(60px);
          pointer-events: none;
        }
        .auth-logo {
          height: 125px;
          object-fit: contain;
          filter: drop-shadow(0 10px 24px rgba(0,0,0,0.45));
          animation: fadeIn 0.3s ease-out;
          transition: transform 0.3s ease;
          margin-bottom: 1.5rem;
        }
        .auth-logo:hover {
          transform: scale(1.03);
        }
        .auth-mobile-logo {
          height: 70px;
          object-fit: contain;
          margin-bottom: 1rem;
          animation: fadeIn 0.3s ease-out;
        }
        @media (min-width: 900px) {
          .auth-mobile-logo { display: none; }
        }
        .auth-eyebrow-text {
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #f43f5e;
          margin-bottom: 0.75rem;
          animation: fadeIn 0.3s ease-out 0.05s both;
        }
        .auth-title-main {
          font-family: var(--font-serif, Georgia, serif);
          font-size: clamp(2.25rem, 4vw, 3.5rem);
          font-weight: 700;
          line-height: 1.15;
          margin-bottom: 1rem;
          color: #ffffff;
          animation: slideIn 0.3s ease-out 0.1s both;
        }
        .auth-title-highlight {
          color: #e11d48;
        }
        .auth-subtitle-main {
          font-size: 1.05rem;
          line-height: 1.6;
          color: rgba(255,255,255,0.8);
          max-width: 440px;
          margin: 0 auto;
          animation: slideIn 0.3s ease-out 0.15s both;
        }
        .auth-form-container {
          width: 100%;
          max-width: 420px;
          margin: 0 auto;
          animation: fadeIn 0.25s ease-out both;
        }
        .auth-form-container .ds-input {
          border-radius: 9999px !important;
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
          height: 48px;
          border: 1.5px solid #e2e8f0;
          font-size: 0.95rem;
          transition: all 0.2s ease-in-out;
          background: #ffffff;
        }
        .auth-form-container .ds-input:focus {
          border-color: #e11d48 !important;
          box-shadow: 0 0 0 4px rgba(225, 29, 72, 0.12) !important;
          outline: none;
        }
        .auth-form-eyebrow {
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #e11d48;
          margin-bottom: 0.5rem;
        }
        .auth-form-title {
          font-size: 2rem;
          font-family: var(--font-serif, Georgia, serif);
          font-weight: 800;
          color: #111827;
          margin-bottom: 0.5rem;
          line-height: 1.2;
        }
        .auth-form-subtitle {
          font-size: 0.95rem;
          color: #4b5563;
          margin-bottom: 2rem;
          line-height: 1.5;
        }
      `}</style>

      <div className="auth-container">
        {/* LEFT PANEL - Premium Branding */}
        <div className="auth-left">
          <div className="auth-glow"></div>
          
          <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", maxWidth: "520px" }}>
            {/* Logo */}
            <Link to="/">
              <img src="/assets/ai_marriage_logo.png" alt="AI Marriage Logo" className="auth-logo" />
            </Link>

            <p className="auth-eyebrow-text">INTELLIGENT. SECURE. LIFELONG.</p>
            
            <h1 className="auth-title-main">
              {variant === "login" ? (
                <>Find the connection <br/><span className="auth-title-highlight">of a lifetime.</span></>
              ) : (
                <>{content.title}</>
              )}
            </h1>
            
            <p className="auth-subtitle-main">{content.subtitle}</p>

            {/* Testimonial Quote */}
            <div
              style={{
                marginTop: "2rem",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "14px",
                padding: "0.85rem 1.25rem",
                maxWidth: "420px",
                backdropFilter: "blur(12px)",
              }}
            >
              <p style={{ margin: 0, fontSize: "0.85rem", fontStyle: "italic", color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.4 }}>
                "{content.quote}"
              </p>
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", fontWeight: 700, color: "#f43f5e", letterSpacing: "0.02em" }}>
                — {content.author}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Login Form */}
        <div className="auth-right">
          <div className="auth-form-container">
            {/* Mobile Logo (Visible only on small screens) */}
            <div style={{ textAlign: "center" }}>
              <Link to="/">
                <img src="/assets/ai_marriage_logo.png" alt="AI Marriage Logo" className="auth-mobile-logo" />
              </Link>
            </div>

            {eyebrow && <p className="auth-form-eyebrow">{eyebrow}</p>}
            <h2 className="auth-form-title">{title}</h2>
            <p className="auth-form-subtitle">{subtitle}</p>

            <div style={{ marginTop: "2rem" }}>
              {children}
            </div>
            
        
          </div>
        </div>
      </div>
    </>
  );
}
