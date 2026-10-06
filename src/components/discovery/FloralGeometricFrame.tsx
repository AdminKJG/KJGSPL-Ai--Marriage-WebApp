import { useState } from "react";

interface FloralGeometricFrameProps {
  photoSrc: string | null;
  displayName: string;
  initial: string;
  onError?: () => void;
}

export function FloralGeometricFrame({
  photoSrc,
  displayName,
  initial,
  onError,
}: FloralGeometricFrameProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      {/* 1. Candidate Photo Clipped into the Geometric Gold Frame */}
      {photoSrc && !hasError ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            clipPath:
              "polygon(32.5% 11.2%, 67.5% 11.2%, 88.8% 33.5%, 88.8% 66.5%, 67.5% 88.8%, 32.5% 88.8%, 11.2% 66.5%, 11.2% 33.5%)",
            overflow: "hidden",
            zIndex: 1,
            background: "#faf4ee",
          }}
        >
          <img
            src={photoSrc}
            alt={`Portrait of ${displayName}`}
            onError={() => {
              setHasError(true);
              onError?.();
            }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 18%",
              transition: "transform 0.4s ease",
            }}
          />
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            clipPath:
              "polygon(32.5% 11.2%, 67.5% 11.2%, 88.8% 33.5%, 88.8% 66.5%, 67.5% 88.8%, 32.5% 88.8%, 11.2% 66.5%, 11.2% 33.5%)",
            overflow: "hidden",
            zIndex: 1,
            background: "linear-gradient(145deg, #ea580c 0%, #c2410c 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
          }}
        >
          <span
            style={{
              fontSize: "2.2rem",
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontWeight: 700,
            }}
          >
            {initial}
          </span>
        </div>
      )}

      {/* 2. Realistic Luxury Golden Floral Frame Transparent PNG */}
      <img
        src="/assets/floral_gold_frame.png"
        alt="Floral Gold Frame"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          zIndex: 2,
          pointerEvents: "none",
          filter: "drop-shadow(0 10px 22px rgba(234, 88, 12, 0.45)) drop-shadow(0 2px 6px rgba(194, 65, 12, 0.25))",
        }}
      />
    </div>
  );
}
