import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Profile } from "@/lib/api/types";
import { getProfilePhotoUrl } from "@/lib/api/client";
import { humanize } from "@/lib/cn";
import { ShieldCheckIcon, SparklesIcon } from "@/components/icons/NavIcons";
import { FloralGeometricFrame } from "./FloralGeometricFrame";

export interface HorizontalCandidateCardProps {
  profile: Profile;
  onSendInterest: (id: string) => void;
  onPass?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalCount?: number;
  isSendingInterest?: boolean;
  interestSent?: boolean;
}

export function HorizontalCandidateCard({
  profile: p,
  onSendInterest,
  onPass,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  currentIndex = 0,
  totalCount = 1,
  isSendingInterest = false,
  interestSent = false,
}: HorizontalCandidateCardProps) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const photoSrc = getProfilePhotoUrl(p);
  const displayName = p.name?.trim() || "Member";
  const initial = displayName[0]?.toUpperCase() || "?";
  const alignmentScore = (p as any).alignment as number | undefined;
  const matchReason = (p as any).reason as string | undefined;
  const isFictional = (p as any).fictional || p.identityLabel === "Fictional practice profile";

  const interests = p.interests ?? [];
  const values = p.values ?? [];
  const languages = p.languages ?? [];
  const education = p.education;
  const cultural = (p.cultural as Record<string, string | undefined>) ?? {};

  // Build quick facts
  const quickFacts: Array<{ icon: string; label: string; text: string }> = [];
  if (education) quickFacts.push({ icon: "🎓", label: "Education", text: education });
  if (languages.length > 0) quickFacts.push({ icon: "🗣️", label: "Languages", text: languages.join(", ") });
  if (cultural.religion || cultural.faith) {
    quickFacts.push({ icon: "🕊️", label: "Community", text: cultural.religion || cultural.faith! });
  }
  if (cultural.diet) quickFacts.push({ icon: "🥗", label: "Diet", text: cultural.diet });
  if (p.gender) quickFacts.push({ icon: "👤", label: "Gender", text: humanize(p.gender) });

  return (
    <article className="matrimonial-horizontal-container">
      {/* ========================================================
          LEFT COLUMN: FLORAL GEOMETRIC WEDDING FRAME PORTRAIT
         ======================================================== */}
      <div className="matrimonial-photo-card">
        <FloralGeometricFrame
          photoSrc={photoSrc}
          displayName={displayName}
          initial={initial}
          onError={() => setImgError(true)}
        />
      </div>

      {/* ========================================================
          RIGHT COLUMN: SEPARATE CANDIDATE DETAILS CARD
         ======================================================== */}
      <div className="matrimonial-details-card">
        {/* Main Details Container (Streamlined with No Scrollbar) */}
        <div
          className="matrimonial-scroll-content"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.45rem",
            overflow: "hidden",
            minHeight: 0,
            flex: 1,
          }}
        >
          {/* Top Status Badges & Shortlist Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
              {alignmentScore != null && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.2rem 0.65rem",
                    borderRadius: "9999px",
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "#059669",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                  title={matchReason || "High compatibility match"}
                >
                  <SparklesIcon size={12} />
                  <span>{alignmentScore}% Match</span>
                </span>
              )}

              {isFictional ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "9999px",
                    background: "var(--surface-raised, rgba(0, 0, 0, 0.05))",
                    color: "var(--muted-foreground, #64748b)",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    border: "1px solid var(--line, rgba(0, 0, 0, 0.08))",
                  }}
                >
                  Practice Profile
                </span>
              ) : (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "9999px",
                    background: "rgba(16, 185, 129, 0.1)",
                    color: "#059669",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  <ShieldCheckIcon size={13} /> Verified Member
                </span>
              )}
            </div>

            {/* Shortlist Heart Button */}
            <button
              type="button"
              onClick={() => setIsSaved(!isSaved)}
              style={{
                width: "2.1rem",
                height: "2.1rem",
                borderRadius: "9999px",
                border: isSaved ? "1px solid #e11d48" : "1px solid var(--border, rgba(0, 0, 0, 0.12))",
                background: isSaved ? "rgba(225, 29, 72, 0.1)" : "var(--surface, rgba(0,0,0,0.02))",
                color: isSaved ? "#e11d48" : "var(--muted-foreground, #64748b)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              title={isSaved ? "Remove from Shortlist" : "Save to Shortlist"}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill={isSaved ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>

          {/* 1. Header: Name, Age, Location, Profession */}
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.45rem", flexWrap: "wrap" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.65rem",
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontWeight: 700,
                  color: "var(--foreground, #0f172a)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                }}
              >
                {displayName}
              </h2>
              {p.age && (
                <span
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 600,
                    color: "var(--rose-active, #be123c)",
                  }}
                >
                  {p.age}
                </span>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.8rem",
                color: "var(--muted-foreground, #475569)",
                marginTop: "0.15rem",
                flexWrap: "wrap",
              }}
            >
              {p.city && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                  <span>📍</span> <strong>{p.city}</strong>
                </span>
              )}
              {p.city && p.occupation && <span>•</span>}
              {p.occupation && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                  <span>💼</span> {p.occupation}
                </span>
              )}
            </div>
          </div>

          {/* 2. Relationship Intention Banner */}
          {p.intention && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.3rem 0.65rem",
                borderRadius: "0.45rem",
                background: "linear-gradient(135deg, rgba(255, 241, 242, 0.95), rgba(254, 226, 226, 0.65))",
                border: "1px solid rgba(251, 113, 133, 0.25)",
                color: "var(--rose-active, #be123c)",
                fontSize: "0.78rem",
                fontWeight: 600,
              }}
            >
              <span style={{ fontSize: "0.85rem" }}>💍</span>
              <span style={{ color: "#881337" }}>Looking for:</span>
              <span style={{ color: "#4c0519", fontWeight: 500 }}>{p.intention}</span>
            </div>
          )}

          {/* 3. Key Matrimonial Facts Grid */}
          {quickFacts.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "0.3rem 0.75rem",
                padding: "0.45rem 0.7rem",
                background: "var(--surface, rgba(0, 0, 0, 0.02))",
                borderRadius: "0.55rem",
                border: "1px solid var(--border, rgba(0, 0, 0, 0.06))",
              }}
            >
              {quickFacts.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    fontSize: "0.74rem",
                    color: "var(--foreground, #334155)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={f.text}
                >
                  <span style={{ fontSize: "0.85rem" }}>{f.icon}</span>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                    <span style={{ fontWeight: 600, color: "var(--muted-foreground, #64748b)", fontSize: "0.66rem", display: "block", lineHeight: 1.1 }}>
                      {f.label}
                    </span>
                    <span style={{ fontWeight: 500 }}>{f.text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 4. Bio Snippet */}
          {p.bio && (
            <p
              style={{
                margin: 0,
                fontSize: "0.78rem",
                lineHeight: 1.4,
                color: "var(--foreground, #334155)",
                fontStyle: "italic",
                padding: "0.35rem 0.7rem",
                borderLeft: "3px solid var(--rose, #e11d48)",
                background: "rgba(244, 63, 94, 0.04)",
                borderRadius: "0 0.35rem 0.35rem 0",
              }}
            >
              “{p.bio}”
            </p>
          )}

          {/* 5. Combined Interests & Values Chips */}
          {(interests.length > 0 || values.length > 0) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", alignItems: "center" }}>
              {interests.map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "9999px",
                    background: "var(--surface, #f8fafc)",
                    border: "1px solid var(--border, #e2e8f0)",
                    color: "var(--foreground, #334155)",
                    fontSize: "0.72rem",
                    fontWeight: 500,
                  }}
                >
                  {humanize(tag)}
                </span>
              ))}
              {values.map((v) => (
                <span
                  key={v}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "9999px",
                    background: "rgba(244, 63, 94, 0.07)",
                    border: "1px solid rgba(244, 63, 94, 0.18)",
                    color: "#9f1239",
                    fontSize: "0.72rem",
                    fontWeight: 500,
                  }}
                >
                  {v}
                </span>
              ))}
            </div>
          )}

          {/* 6. AI Compatibility Reason */}
          {matchReason && (
            <div
              style={{
                padding: "0.35rem 0.65rem",
                borderRadius: "0.45rem",
                background: "rgba(16, 185, 129, 0.07)",
                border: "1px dashed rgba(16, 185, 129, 0.3)",
                color: "#065f46",
                fontSize: "0.73rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.35rem",
                lineHeight: 1.35,
              }}
            >
              <span style={{ fontSize: "0.85rem" }}>💡</span>
              <div>
                <strong style={{ color: "#047857" }}>AI Compatibility:</strong> {matchReason}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            7. BOTTOM ACTION BAR (Firmly Anchored)
           ======================================================== */}
        <div
          style={{
            paddingTop: "0.6rem",
            borderTop: "1px solid var(--border, rgba(0, 0, 0, 0.08))",
            display: "flex",
            flexDirection: "column",
            gap: "0.45rem",
            flexShrink: 0,
          }}
        >
          {/* Main Action Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.6fr", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={onPass}
              style={{
                padding: "0.65rem 0.85rem",
                borderRadius: "0.6rem",
                border: "1.5px solid var(--border, #cbd5e1)",
                background: "transparent",
                color: "var(--foreground, #475569)",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
                transition: "all 0.15s ease",
              }}
              className="matrimonial-btn--secondary"
            >
              <span>✕</span>
              <span>Pass</span>
            </button>

            <button
              type="button"
              onClick={() => navigate({ to: "/profile/$id", params: { id: p.id } })}
              style={{
                padding: "0.65rem 0.85rem",
                borderRadius: "0.6rem",
                border: "1.5px solid var(--border, #cbd5e1)",
                background: "transparent",
                color: "var(--foreground, #1e293b)",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
                transition: "all 0.15s ease",
              }}
              className="matrimonial-btn--secondary"
            >
              <span>View Profile</span>
            </button>

            <button
              type="button"
              disabled={isSendingInterest || interestSent}
              onClick={() => onSendInterest(p.id)}
              style={{
                padding: "0.65rem 1rem",
                borderRadius: "0.6rem",
                border: "none",
                background: interestSent
                  ? "#10b981"
                  : "linear-gradient(135deg, #e11d48 0%, #be123c 60%, #9f1239 100%)",
                color: "#ffffff",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: interestSent || isSendingInterest ? "default" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.45rem",
                boxShadow: interestSent ? "none" : "0 4px 14px rgba(225, 29, 72, 0.35)",
                transition: "all 0.15s ease",
              }}
              className="matrimonial-btn--primary"
            >
              {isSendingInterest ? (
                <span>Sending...</span>
              ) : interestSent ? (
                <>
                  <span>✓</span>
                  <span>Interest Sent</span>
                </>
              ) : (
                <>
                  <span>❤️</span>
                  <span>Send Interest</span>
                </>
              )}
            </button>
          </div>

          {/* Navigation footer: Previous / Next & Counter */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.8rem",
              color: "var(--muted-foreground, #64748b)",
              paddingTop: "0.15rem",
            }}
          >
            <button
              type="button"
              disabled={!hasPrev}
              onClick={onPrev}
              style={{
                background: "none",
                border: "none",
                color: hasPrev ? "var(--foreground, #334155)" : "var(--muted, #cbd5e1)",
                cursor: hasPrev ? "pointer" : "default",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.15rem 0.35rem",
              }}
            >
              <span>←</span> Prev
            </button>

            <span style={{ fontWeight: 600, color: "var(--foreground, #1e293b)" }}>
              {currentIndex + 1} of {totalCount}
            </span>

            <button
              type="button"
              disabled={!hasNext}
              onClick={onNext}
              style={{
                background: "none",
                border: "none",
                color: hasNext ? "var(--rose-active, #be123c)" : "var(--muted, #cbd5e1)",
                cursor: hasNext ? "pointer" : "default",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.15rem 0.35rem",
              }}
            >
              Next <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// Backward compatibility alias
export const CandidateCard = HorizontalCandidateCard;
