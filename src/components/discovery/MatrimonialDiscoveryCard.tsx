import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Profile } from "@/lib/api/types";
import { getProfilePhotoUrl } from "@/lib/api/client";
import { SparklesIcon } from "@/components/icons/NavIcons";
import { FloralGeometricFrame } from "./FloralGeometricFrame";

export interface MatrimonialDiscoveryCardProps {
  profile: Profile;
  onSendInterest: (id: string) => void;
  onPass?: () => void;
  isSendingInterest?: boolean;
  interestSent?: boolean;
}

export function MatrimonialDiscoveryCard({
  profile: p,
  onSendInterest,
  onPass,
  isSendingInterest = false,
  interestSent = false,
}: MatrimonialDiscoveryCardProps) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const photoSrc = getProfilePhotoUrl(p);
  const displayName = p.name?.trim() || "Member";
  const initial = displayName[0]?.toUpperCase() || "?";
  const alignmentScore = (p as any).alignment as number | undefined;
  const matchScore = alignmentScore ?? (p.age ? 85 + (p.age % 13) : 96);
  const isFictional = (p as any).fictional || p.identityLabel === "Fictional practice profile";

  const interests = p.interests ?? [];
  const values = p.values ?? [];
  const languages = p.languages ?? [];
  const education = p.education;
  const cultural = p.cultural as Record<string, string> | undefined;

  const intentionText = p.intention
    ? p.intention.length > 22
      ? p.intention.slice(0, 22) + "..."
      : p.intention
    : "LONG-TERM BOND";

  return (
    <article
      className="matrimonial-3card-item"
      style={{
        position: "relative",
        background: "#ffffff",
        borderRadius: "1.75rem",
        border: "2px solid #ea580c",
        boxShadow:
          "0 30px 64px -10px rgba(234, 88, 12, 0.55), 0 14px 32px -4px rgba(194, 65, 12, 0.35), 0 0 0 1.5px rgba(234, 88, 12, 0.2)",
        marginTop: "4.5rem",
        padding: "4.25rem 1.35rem 1.35rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "0.95rem",
      }}
    >
      {/* 1. TOP FLORAL GOLD FRAME AVATAR (Enlarged to 148px, Overlapping Top Edge) */}
      <div
        style={{
          position: "absolute",
          top: "-74px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          width: "148px",
          height: "148px",
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
              bottom: "6px",
              right: "6px",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ea580c, #c2410c)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.8rem",
              fontWeight: 800,
              border: "2.5px solid #ffffff",
              boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
              zIndex: 12,
            }}
          >
            {p.age ? p.age : "✨"}
          </div>
        </div>
      </div>

      {/* 2. TOP PILLS ROW (Repair Capacity / Intention & Emotional Sync) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.45rem",
          marginTop: "0.35rem",
        }}
      >
        {/* Left Pill */}
        <div
          style={{
            flex: 1.1,
            minWidth: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.35rem 0.5rem",
            borderRadius: "9999px",
            background: "#fff7ed",
            border: "1.5px solid #fed7aa",
            color: "#c2410c",
            fontSize: "0.68rem",
            fontWeight: 800,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={p.intention || p.city || "Long-Term Bond"}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {intentionText}
          </span>
        </div>

        {/* Right Pill: % Emotional Sync */}
        <div
          style={{
            flex: 0.9,
            minWidth: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.2rem",
            padding: "0.35rem 0.5rem",
            borderRadius: "9999px",
            background: "#ecfdf5",
            border: "1.5px solid #d1fae5",
            color: "#059669",
            fontSize: "0.72rem",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          <SparklesIcon size={11} />
          <span>{matchScore}% Sync</span>
        </div>
      </div>

      {/* 3. MAIN TITLE & SUBTITLE */}
      <div style={{ textAlign: "center", margin: "0.2rem 0" }}>
        <h3
          style={{
            margin: 0,
            fontSize: "1.5rem",
            fontFamily: "var(--font-serif, Georgia, serif)",
            fontWeight: 700,
            color: "#1c1917",
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
          }}
        >
          {displayName}
        </h3>
        <p
          style={{
            margin: "0.25rem 0 0",
            fontSize: "0.84rem",
            fontStyle: "italic",
            color: "#78716c",
            lineHeight: 1.35,
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
          borderLeft: "4px solid #ea580c",
          borderRadius: "0.85rem",
          padding: "0.85rem 1rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", fontWeight: 700, color: "#1c1917" }}>
          <span style={{ color: "#10b981", fontSize: "0.65rem" }}>●</span>
          <span>{displayName}</span>
          <span style={{ color: "#78716c", fontWeight: 400, fontSize: "0.74rem" }}>
            ({p.city || "India"} • {p.age ? `${p.age} Yrs` : "Member"})
          </span>
        </div>
        <p
          style={{
            margin: "0.35rem 0 0",
            fontSize: "0.78rem",
            fontStyle: "italic",
            color: "#57534e",
            lineHeight: 1.4,
          }}
        >
          "{p.bio ? (p.bio.length > 110 ? p.bio.slice(0, 110) + "..." : p.bio) : "Looking for a meaningful relationship built on emotional safety, open communication, and shared growth."}"
        </p>

        {/* Value / Interest tags inside story box */}
        {(values.length > 0 || interests.length > 0) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.55rem" }}>
            {values.slice(0, 2).map((v) => (
              <span
                key={v}
                style={{
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                  color: "#9a3412",
                  padding: "0.15rem 0.5rem",
                  borderRadius: "9999px",
                  fontSize: "0.68rem",
                  fontWeight: 600,
                }}
              >
                ✦ {v}
              </span>
            ))}
            {interests.slice(0, 2).map((tag) => (
              <span
                key={tag}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#475569",
                  padding: "0.15rem 0.5rem",
                  borderRadius: "9999px",
                  fontSize: "0.68rem",
                  fontWeight: 500,
                }}
              >
                {tag}
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
        {/* Heart Shortlist */}
        <button
          type="button"
          onClick={() => setIsSaved(!isSaved)}
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

        {/* Connect Button */}
        <button
          type="button"
          onClick={() => onSendInterest(p.id)}
          disabled={isSendingInterest || interestSent}
          style={{
            padding: "0.55rem 0.75rem",
            borderRadius: "0.65rem",
            border: "none",
            background: interestSent
              ? "#10b981"
              : "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
            color: "#ffffff",
            fontSize: "0.78rem",
            fontWeight: 700,
            cursor: interestSent || isSendingInterest ? "default" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.3rem",
            boxShadow: interestSent ? "none" : "0 4px 14px rgba(234, 88, 12, 0.35)",
            transition: "all 0.15s ease",
          }}
        >
          <span>{interestSent ? "✓ Connected" : isSendingInterest ? "Sending..." : "💖 Connect"}</span>
        </button>
      </div>
    </article>
  );
}
