import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Profile } from "@/lib/api/types";
import { getProfilePhotoUrl } from "@/lib/api/client";
import { SparklesIcon } from "@/components/icons/NavIcons";
import { FloralGeometricFrame } from "./FloralGeometricFrame";
import { CompatibilityModal } from "./CompatibilityModal";

export interface MatrimonialDiscoveryCardProps {
  profile: Profile;
  onSendInterest: (id: string) => void;
  onToggleSave?: (id: string, currentlySaved: boolean) => void;
  onPass?: (id: string) => void;
  onBlock?: (id: string) => void;
  isSendingInterest?: boolean;
  interestSent?: boolean;
  isSaved?: boolean;
  isMatched?: boolean;
}

function formatTag(str: string): string {
  const clean = str.replace(/^(interest_|value_|lifestyle_)/i, "").replace(/_/g, " ");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function MatrimonialDiscoveryCard({
  profile: p,
  onSendInterest,
  onToggleSave,
  onPass,
  onBlock,
  isSendingInterest = false,
  interestSent = false,
  isSaved = false,
  isMatched = false,
}: MatrimonialDiscoveryCardProps) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [showCompatibility, setShowCompatibility] = useState(false);

  const photoSrc = getProfilePhotoUrl(p);
  const displayName = p.name?.trim() || "Member";
  const initial = displayName[0]?.toUpperCase() || "?";
  const alignmentScore = (p as any).alignment as number | undefined;
  const matchScore = alignmentScore ?? (p.age ? 85 + (p.age % 13) : 96);

  const interests = p.interests ?? [];
  const values = p.values ?? [];

  const intentionText = p.intention
    ? p.intention.length > 18
      ? "SERIOUS RELATIONSHIP"
      : p.intention.toUpperCase()
    : "SERIOUS MATCH";

  return (
    <>
      <article
        className="matrimonial-3card-item"
        style={{
          position: "relative",
          background: "#ffffff",
          borderRadius: "1.5rem",
          border: "2px solid #ea580c",
          boxShadow:
            "0 20px 48px -10px rgba(234, 88, 12, 0.45), 0 10px 24px -4px rgba(194, 65, 12, 0.25), 0 0 0 1.5px rgba(234, 88, 12, 0.15)",
          marginTop: "3.25rem",
          padding: "3.5rem 1.15rem 1rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "0.65rem",
        }}
      >
        {/* 1. TOP FLORAL GOLD FRAME AVATAR */}
        <div
          style={{
            position: "absolute",
            top: "-64px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            width: "128px",
            height: "128px",
          }}
        >
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <FloralGeometricFrame
              photoSrc={photoSrc}
              displayName={displayName}
              initial={initial}
              onError={() => setImgError(true)}
            />

            {/* Badge indicator on bottom-right of floral frame */}
            <div
              style={{
                position: "absolute",
                bottom: "4px",
                right: "4px",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ea580c, #c2410c)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 800,
                border: "2px solid #ffffff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                zIndex: 12,
              }}
            >
              {p.age ? p.age : "✨"}
            </div>
          </div>
        </div>

        {/* 2. TOP PILL (% Emotional Sync Clickable Pill) */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "0.85rem",
          }}
        >
          <button
          
            type="button"
            onClick={() => setShowCompatibility(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.25rem",
              padding: "0.32rem 0.75rem",
              borderRadius: "9999px",
              background: "#ecfdf5",
              border: "1.5px solid #d1fae5",
              color: "#059669",
              fontSize: "0.75rem",
              fontWeight: 700,
              whiteSpace: "nowrap",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(5, 150, 105, 0.1)",
            }}
            title="Click to view 5-category compatibility breakdown (/v1/profiles/:id/compatibility)"
          >
            <SparklesIcon size={12} />
            <span>{matchScore}% Sync</span>
          </button>
        </div>

        {/* 3. MAIN TITLE & SUBTITLE */}
        <div style={{ textAlign: "center", margin: "0.1rem 0" }}>
          <h3
            style={{
              margin: 0,
              fontSize: "1.35rem",
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontWeight: 700,
              color: "#1c1917",
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}
          >
            {displayName}
          </h3>
          <p
            style={{
              margin: "0.15rem 0 0",
              fontSize: "0.8rem",
              fontStyle: "italic",
              color: "#78716c",
              lineHeight: 1.3,
            }}
          >
            {p.occupation ? `${p.occupation} • ` : ""}
            {p.city || "Verified Member"}
          </p>
        </div>

        {/* 4. BOTTOM STORY / BIO CARD WITH LEFT ACCENT BAR */}
        <div
          style={{
            background: "#ffffff",
            border: "1.5px solid #f4ede4",
            borderLeft: "3.5px solid #ea580c",
            borderRadius: "0.75rem",
            padding: "0.65rem 0.85rem",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.78rem",
              fontStyle: "italic",
              color: "#57534e",
              lineHeight: 1.35,
            }}
          >
            "{p.bio ? (p.bio.length > 95 ? p.bio.slice(0, 95) + "..." : p.bio) : "Looking for a meaningful relationship built on emotional safety, open communication, and shared growth."}"
          </p>

          {/* Value / Interest tags inside story box */}
          {(values.length > 0 || interests.length > 0) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.45rem" }}>
              {values.slice(0, 2).map((v) => (
                <span
                  key={v}
                  style={{
                    background: "#fff7ed",
                    border: "1px solid #fed7aa",
                    color: "#9a3412",
                    padding: "0.12rem 0.45rem",
                    borderRadius: "9999px",
                    fontSize: "0.65rem",
                    fontWeight: 600,
                  }}
                >
                  ✦ {formatTag(v)}
                </span>
              ))}
              {interests.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    color: "#475569",
                    padding: "0.12rem 0.45rem",
                    borderRadius: "9999px",
                    fontSize: "0.65rem",
                    fontWeight: 500,
                  }}
                >
                  {formatTag(tag)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 5. CARD ACTION BUTTONS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr 1.6fr",
            gap: "0.45rem",
            alignItems: "center",
            marginTop: "0.2rem",
          }}
        >
          {/* Heart Shortlist (/v1/saved) */}
          <button
            type="button"
            onClick={() => onToggleSave && onToggleSave(p.id, isSaved)}
            style={{
              width: "2.35rem",
              height: "2.35rem",
              borderRadius: "0.65rem",
              border: isSaved ? "1.5px solid #e11d48" : "1.5px solid #fed7aa",
              background: isSaved ? "rgba(225, 29, 72, 0.08)" : "#fff7ed",
              color: isSaved ? "#e11d48" : "#ea580c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
            title={isSaved ? "Unsave Profile (/v1/saved/:id)" : "Save Profile (/v1/saved)"}
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

          {/* View Profile Button */}
          <button
            type="button"
            onClick={() => navigate({ to: "/profile/$id", params: { id: p.id } })}
            style={{
              padding: "0.55rem 0.65rem",
              borderRadius: "0.65rem",
              border: "1.5px solid #fed7aa",
              background: "#ffffff",
              color: "#7c2d12",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
          >
            View
          </button>

          {/* Connect / Express Interest Button (/v1/interest) */}
          <button
            type="button"
            onClick={() => onSendInterest(p.id)}
            disabled={isSendingInterest || interestSent || isMatched}
            style={{
              padding: "0.55rem 0.75rem",
              borderRadius: "0.65rem",
              border: "none",
              background: isMatched
                ? "#059669"
                : interestSent
                ? "#10b981"
                : "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
              color: "#ffffff",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: interestSent || isMatched || isSendingInterest ? "default" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.3rem",
              boxShadow: interestSent || isMatched ? "none" : "0 4px 14px rgba(234, 88, 12, 0.35)",
              transition: "all 0.15s ease",
            }}
          >
            <span>
              {isMatched ? "✨ Matched" : interestSent ? "✓ Sent" : isSendingInterest ? "Sending..." : "💖 Connect"}
            </span>
          </button>
        </div>
      </article>

      {/* 5-Category Compatibility Breakdown Modal */}
      {showCompatibility && (
        <CompatibilityModal profile={p} onClose={() => setShowCompatibility(false)} />
      )}
    </>
  );
}
