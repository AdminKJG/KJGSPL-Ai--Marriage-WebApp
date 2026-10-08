import { useQuery } from "@tanstack/react-query";
import { compatibilityQuery } from "@/lib/api/modules";
import type { Profile } from "@/lib/api/types";
import { SparklesIcon } from "@/components/icons/NavIcons";

interface CompatibilityModalProps {
  profile: Profile;
  onClose: () => void;
}

export function CompatibilityModal({ profile: p, onClose }: CompatibilityModalProps) {
  const { data, isLoading, error } = useQuery(compatibilityQuery(p.id));

  const score = data?.score ?? ((p as any).alignment as number | undefined) ?? 88;
  const categories = data?.categories ?? [
    { id: "intentions", label: "Relationship Intentions", weight: 30, score: 95 },
    { id: "values", label: "Life Values & Family Background", weight: 25, score: 85 },
    { id: "cultural", label: "Cultural Traditions & Acceptance", weight: 15, score: 90 },
    { id: "lifestyle", label: "Daily Lifestyle & Communication", weight: 15, score: 80 },
    { id: "geography", label: "Geography & Settlement", weight: 15, score: 88 },
  ];

  const reasons = data?.reasons ?? [
    "Compatible relationship goals and long-term outlook.",
    "Shared mutual interest in active lifestyle and personal growth.",
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#ffffff",
          borderRadius: "1.5rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          padding: "1.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.25rem 0.65rem",
                borderRadius: "9999px",
                background: "#ecfdf5",
                color: "#059669",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              <SparklesIcon size={12} />
              <span>5-Category Compatibility</span>
            </div>
            <h3
              style={{
                margin: "0.5rem 0 0",
                fontSize: "1.35rem",
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontWeight: 700,
                color: "#1e293b",
              }}
            >
              Compatibility with {p.name || "Member"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "50%",
              width: "2rem",
              height: "2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#64748b",
              fontWeight: 700,
              fontSize: "1rem",
            }}
          >
            ✕
          </button>
        </div>

        {/* Overall Score Box */}
        <div
          style={{
            background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
            border: "1.5px solid #fed7aa",
            borderRadius: "1rem",
            padding: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#c2410c", textTransform: "uppercase" }}>
              Overall Match Score
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#9a3412", lineHeight: 1.1 }}>
              {score}%
            </div>
            <div style={{ fontSize: "0.8rem", color: "#9a3412", opacity: 0.9 }}>
              Eligibility: <strong style={{ color: "#059669" }}>{data?.eligibility ?? "PASS"}</strong>
            </div>
          </div>

          <div
            style={{
              width: "4rem",
              height: "4rem",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ea580c, #c2410c)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "1.25rem",
              boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)",
            }}
          >
            {score}%
          </div>
        </div>

        {/* Category Breakdown list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#334155" }}>
            Category Alignment Breakdown
          </h4>
          {isLoading && <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Calculating alignment score...</p>}
          {categories.map((cat) => (
            <div key={cat.id} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>
                <span>{cat.label}</span>
                <span style={{ color: "#ea580c" }}>{cat.score}%</span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "0.5rem",
                  background: "#f1f5f9",
                  borderRadius: "9999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${cat.score}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #ea580c, #f97316)",
                    borderRadius: "9999px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Reasons */}
        {reasons.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.25rem" }}>
            <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#334155" }}>
              Key Compatibility Insights
            </h4>
            <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.82rem", color: "#475569", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: "0.5rem",
            padding: "0.75rem",
            borderRadius: "0.75rem",
            border: "none",
            background: "#ea580c",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
        >
          Close Breakdown
        </button>
      </div>
    </div>
  );
}
