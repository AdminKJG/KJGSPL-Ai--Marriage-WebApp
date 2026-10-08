import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ChangeEvent } from "react";
import { Button, Card, Input, Label, Text } from "@/components/ui";
import { ErrorState } from "@/components/ui";
import { MatrimonialDiscoveryCard } from "@/components/discovery/MatrimonialDiscoveryCard";
import { configQuery, connectionsQuery, discoveryApi, discoveryQuery, getLocalSavedIds, qk } from "@/lib/api/modules";

export const Route = createFileRoute("/_member/discover")({
  head: () => ({
    meta: [
      { title: "Discover — AI Marriage" },
      { name: "description", content: "Browse compatible member profiles chosen for you today." },
      { property: "og:title", content: "Discover — AI Marriage" },
      { property: "og:description", content: "Browse compatible member profiles chosen for you today." },
    ],
  }),
  component: DiscoverPage,
});

const DEFAULT_INTEREST_OPTIONS = [
  "Travel",
  "Music",
  "Fitness & Gym",
  "Reading & Books",
  "Cooking & Foodie",
  "Photography",
  "Art & Design",
  "Tech & Gaming",
  "Yoga & Meditation",
  "Movies & Cinema",
  "Dancing",
  "Nature & Outdoors",
  "Pets",
  "Volunteering",
];

function DiscoverPage() {
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [cityFilter, setCityFilter] = useState("All cities");
  const [interestFilter, setInterestFilter] = useState("All interests");
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [sentInterests, setSentInterests] = useState<Set<string>>(new Set());

  const qc = useQueryClient();
  const config = useQuery(configQuery());

  const interestOptions = useMemo(() => {
    const dynamicInterests = (config.data as any)?.interests ?? [];
    const rawList: string[] = Array.isArray(dynamicInterests)
      ? dynamicInterests
          .map((i: any) => (typeof i === "object" ? i.label || i.name || i.id : String(i)))
          .filter(Boolean)
      : [];

    return Array.from(new Set(["All interests", ...rawList, ...DEFAULT_INTEREST_OPTIONS]));
  }, [config.data]);

  // 1. GET /v1/connections — Fetch connection lists (saved, sent, received, mutual)
  const connections = useQuery(connectionsQuery());

  // 2. GET /v1/discovery — Fetch discovery feed
  const activeCity = cityFilter === "All cities" ? "" : cityFilter;
  const activeInterest = interestFilter === "All interests" ? "" : interestFilter;

  const { data, isLoading, error } = useQuery(
    discoveryQuery({
      page,
      limit: 10,
      city: activeCity,
      interest: activeInterest,
    })
  );

  // 3. POST /v1/interest — Express Interest / Connect
  const interestMutation = useMutation({
    mutationFn: (targetUserId: string) => discoveryApi.expressInterest(targetUserId),
    onSuccess: (_res, profileId) => {
      setSentInterests((prev) => new Set(prev).add(profileId));
      qc.invalidateQueries({ queryKey: qk.connections });
      qc.invalidateQueries({ queryKey: qk.discovery });
    },
  });

  // 4. POST /v1/saved & DELETE /v1/saved/:id — Bookmark / Unsave
  const saveMutation = useMutation({
    mutationFn: ({ targetUserId, currentlySaved }: { targetUserId: string; currentlySaved: boolean }) =>
      currentlySaved ? discoveryApi.unsaveProfile(targetUserId) : discoveryApi.saveProfile(targetUserId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.connections });
    },
  });

  // 5. POST /v1/discovery/pass — Pass / Skip Candidate
  const passMutation = useMutation({
    mutationFn: (targetUserId: string) => discoveryApi.passProfile(targetUserId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.discovery });
    },
  });

  // 6. POST /v1/block — Block Member
  const blockMutation = useMutation({
    mutationFn: (targetUserId: string) => discoveryApi.blockProfile(targetUserId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.discovery });
    },
  });

  // City Autocomplete (/v1/locations/cities?q=...)
  const handleCityChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCityFilter(val || "All cities");
    if (val.trim().length >= 2) {
      try {
        const res = await discoveryApi.getCities(val);
        setCitySuggestions(res.cities || []);
      } catch {
        setCitySuggestions([]);
      }
    } else {
      setCitySuggestions([]);
    }
  };

  // Connection ID Sets
  const savedSet = useMemo(() => {
    const saved = connections.data?.saved;
    const local = getLocalSavedIds();
    const set = new Set<string>(local);
    if (saved && Array.isArray(saved)) {
      saved.forEach((s: any) => {
        const id = typeof s === "string" ? s : s.id;
        if (id) set.add(id);
      });
    }
    return set;
  }, [connections.data, saveMutation.isSuccess, saveMutation.data]);

  const sentSet = useMemo(() => {
    const sent = connections.data?.sent;
    if (!sent) return new Set<string>();
    return new Set(Array.isArray(sent) ? sent.map((s: any) => (typeof s === "string" ? s : s.id)) : []);
  }, [connections.data]);

  const mutualSet = useMemo(() => {
    const mutual = connections.data?.mutual;
    if (!mutual) return new Set<string>();
    return new Set(Array.isArray(mutual) ? mutual.map((m: any) => (typeof m === "string" ? m : m.id)) : []);
  }, [connections.data]);

  // Client-side Filter matching (City & Shared Interest)
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((p) => {
      // City Filter
      if (activeCity) {
        const qCity = activeCity.trim().toLowerCase();
        if (!(p.city || "").toLowerCase().includes(qCity)) return false;
      }
      // Shared Interest Filter
      if (activeInterest) {
        const qInt = activeInterest.trim().toLowerCase();
        const userInterests = (p.interests ?? []).map((i) => i.toLowerCase());
        if (!userInterests.some((i) => i.includes(qInt))) return false;
      }
      return true;
    });
  }, [data?.items, activeCity, activeInterest]);

  const activeFilterCount = (activeCity ? 1 : 0) + (activeInterest ? 1 : 0);

  const resetFilters = () => {
    setCityFilter("All cities");
    setInterestFilter("All interests");
    setCitySuggestions([]);
  };

  return (
    <div className="discover-page-wrapper">
      {/* Header bar matching discover.dart */}
      <div style={{ marginBottom: "1.25rem" }}>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#991b1b",
            textTransform: "uppercase",
            display: "block",
            marginBottom: "0.25rem",
          }}
        >
          BEYOND THE FIRST IMPRESSION
        </span>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "1.85rem",
                fontFamily: "var(--font-serif, Georgia, serif)",
                color: "#1c1917",
                lineHeight: 1.2,
              }}
            >
              Someone worth getting to know.
            </h1>
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem", color: "var(--muted-foreground, #78716c)" }}>
              {data?.remaining != null
                ? `${data.remaining} of 10 daily introductions remaining today`
                : "Curated matches based on long-term compatibility."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: "0.55rem 1.15rem",
              borderRadius: "9999px",
              border: activeFilterCount > 0 ? "1.5px solid #ea580c" : "1px solid #cbd5e1",
              background: activeFilterCount > 0 ? "#fff7ed" : "#ffffff",
              color: activeFilterCount > 0 ? "#ea580c" : "#334155",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              transition: "all 0.15s ease",
            }}
            title="Discovery filters"
          >
            <span>🎛️ Tune Filters</span>
            {activeFilterCount > 0 && (
              <span
                style={{
                  background: "#ea580c",
                  color: "#ffffff",
                  borderRadius: "50%",
                  width: "1.2rem",
                  height: "1.2rem",
                  fontSize: "0.7rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active Filter Chips Bar matching discover.dart */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginTop: "1rem" }}>
          {/* City ActionChip */}
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.8rem",
              fontWeight: 500,
              padding: "0.35rem 0.85rem",
              borderRadius: "9999px",
              border: "1px solid #e2e8f0",
              background: activeCity ? "#fff7ed" : "#f8fafc",
              color: activeCity ? "#c2410c" : "#334155",
              cursor: "pointer",
            }}
          >
            📍 {activeCity || "All cities"}
          </button>

          {/* Shared Interest InputChip */}
          {activeInterest && (
            <span className="filter-chip" onClick={() => setInterestFilter("All interests")}>
              🎯 {activeInterest} ✕
            </span>
          )}

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              style={{
                background: "none",
                border: "none",
                fontSize: "0.8rem",
                color: "#94a3b8",
                cursor: "pointer",
                textDecoration: "underline",
                padding: "0 0.25rem",
              }}
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel matching discover.dart _filters bottom sheet modal */}
      {showFilters && (
        <Card
          variant="surface"
          style={{
            marginBottom: "1.75rem",
            padding: "1.5rem 1.75rem",
            borderRadius: "1.25rem",
            border: "1.5px solid #e2e8f0",
            boxShadow: "0 10px 30px -5px rgba(0,0,0,0.06)",
          }}
        >
          <div className="stack-4">
            <div>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#1c1917" }}>
                Make room for a connection.
              </h3>
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem", color: "#78716c" }}>
                Refine these introductions. Your saved partner requirements still apply.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
              {/* City (Leave empty for All cities) */}
              <div className="stack-1" style={{ position: "relative" }}>
                <Label htmlFor="filter-city" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                  City (Leave empty for All cities)
                </Label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Input
                    id="filter-city"
                    placeholder="Search city (e.g. Mumbai, Delhi)..."
                    value={cityFilter === "All cities" ? "" : cityFilter}
                    onChange={handleCityChange}
                    style={{ paddingRight: "2.25rem" }}
                  />
                  {activeCity && (
                    <button
                      type="button"
                      onClick={() => {
                        setCityFilter("All cities");
                        setCitySuggestions([]);
                      }}
                      style={{
                        position: "absolute",
                        right: "0.6rem",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#94a3b8",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                      }}
                      title="Clear city filter"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {citySuggestions.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      zIndex: 50,
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.5rem",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      maxHeight: "160px",
                      overflowY: "auto",
                    }}
                  >
                    {citySuggestions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setCityFilter(c.split(",")[0]);
                          setCitySuggestions([]);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "0.5rem 0.75rem",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                        }}
                      >
                        📍 {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Shared Interest Dropdown matching discover.dart */}
              <div className="stack-1">
                <Label htmlFor="filter-interest" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                  Shared interest
                </Label>
                <select
                  id="filter-interest"
                  className="ds-input"
                  value={interestFilter}
                  onChange={(e) => setInterestFilter(e.target.value)}
                  style={{
                    padding: "0.55rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--border, #cbd5e1)",
                    background: "#ffffff",
                    fontSize: "0.875rem",
                    width: "100%",
                  }}
                >
                  {interestOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notice matching discover.dart */}
        

            {/* Action Buttons matching discover.dart */}
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", paddingTop: "0.25rem" }}>
              <Button
                variant="primary"
                onClick={() => setShowFilters(false)}
                style={{ borderRadius: "9999px", padding: "0.6rem 1.5rem" }}
              >
                Show {filteredItems.length} introductions
              </Button>
              <Button variant="ghost" onClick={resetFilters} style={{ color: "#64748b" }}>
                Reset these filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      {isLoading && <DiscoverSkeletonGrid count={6} />}
      {error && <ErrorState error={error} />}

      {/* Empty State matching discover.dart EmptyState */}
      {data && filteredItems.length === 0 && !isLoading && (
        <Card variant="surface" style={{ textAlign: "center", padding: "3rem 1.5rem", marginTop: "1rem" }}>
          <div className="stack-3" style={{ alignItems: "center", maxWidth: "450px", margin: "0 auto" }}>
            <div
              style={{
                fontSize: "2.5rem",
                width: "4rem",
                height: "4rem",
                borderRadius: "50%",
                background: "#fff7ed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              🧭
            </div>
            <h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "#1c1917" }}>
              Leave a little room.
            </h3>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b", lineHeight: 1.5 }}>
              No profiles match these selections. Widen your city, interests or partner age preferences.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                setShowFilters(true);
                resetFilters();
              }}
              style={{ marginTop: "0.5rem", borderRadius: "9999px" }}
            >
              Adjust filters
            </Button>
          </div>
        </Card>
      )}

      {/* 3-Column Scrollable Discovery Grid */}
      {filteredItems.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "100%" }}>
          <div className="discover-grid-3cols">
            {filteredItems.map((candidate) => (
              <MatrimonialDiscoveryCard
                key={candidate.id}
                profile={candidate}
                onSendInterest={(id) => interestMutation.mutate(id)}
                onToggleSave={(id, curr) => saveMutation.mutate({ targetUserId: id, currentlySaved: curr })}
                onPass={(id) => passMutation.mutate(id)}
                onBlock={(id) => blockMutation.mutate(id)}
                isSendingInterest={interestMutation.isPending && interestMutation.variables === candidate.id}
                interestSent={sentSet.has(candidate.id) || sentInterests.has(candidate.id)}
                isSaved={savedSet.has(candidate.id)}
                isMatched={mutualSet.has(candidate.id)}
              />
            ))}
          </div>

          {/* Page Pagination Footer */}
          {data?.hasMore || page > 1 ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "1.25rem",
                padding: "1.5rem 0 2.5rem",
              }}
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{
                  padding: "0.5rem 1.15rem",
                  borderRadius: "9999px",
                  border: "1px solid var(--border, #cbd5e1)",
                  background: "var(--card, #ffffff)",
                  color: "var(--foreground, #1e293b)",
                  cursor: page <= 1 ? "default" : "pointer",
                  opacity: page <= 1 ? 0.4 : 1,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                  transition: "all 0.15s ease",
                }}
              >
                ◀ Previous Page
              </button>

              <span style={{ fontSize: "0.85rem", color: "var(--muted-foreground, #64748b)", fontWeight: 500 }}>
                Page {page}
              </span>

              <button
                type="button"
                disabled={!data?.hasMore}
                onClick={() => {
                  if (data?.nextPage) {
                    setPage(data.nextPage);
                  } else {
                    setPage((p) => p + 1);
                  }
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{
                  padding: "0.5rem 1.15rem",
                  borderRadius: "9999px",
                  border: "1px solid var(--border, #cbd5e1)",
                  background: "var(--card, #ffffff)",
                  color: "var(--foreground, #1e293b)",
                  cursor: !data?.hasMore ? "default" : "pointer",
                  opacity: !data?.hasMore ? 0.4 : 1,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                  transition: "all 0.15s ease",
                }}
              >
                Next Page ▶
              </button>
            </div>
          ) : null}
        </div>
      )}

      {interestMutation.error && (
        <p className="ds-field__hint ds-field__hint--error" role="alert" style={{ textAlign: "center", marginTop: "0.5rem" }}>
          {interestMutation.error.message}
        </p>
      )}
    </div>
  );
}

function DiscoverSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div
      className="discover-grid-3cols"
      role="status"
      aria-label="Loading candidate profiles"
      style={{ width: "100%", marginTop: "1rem" }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="matrimonial-3card-item"
          style={{
            position: "relative",
            background: "#ffffff",
            borderRadius: "1.75rem",
            border: "1.5px solid #f1f5f9",
            boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.04)",
            marginTop: "4.5rem",
            padding: "4.25rem 1.35rem 1.35rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.95rem",
          }}
        >
          {/* Top Circular Floating Avatar Skeleton */}
          <div
            style={{
              position: "absolute",
              top: "-4.25rem",
              left: "50%",
              transform: "translateX(-50%)",
              width: "7.5rem",
              height: "7.5rem",
              borderRadius: "50%",
              backgroundColor: "#f1f5f9",
              border: "4px solid #ffffff",
              boxShadow: "0 8px 20px rgba(0, 0, 0, 0.08)",
              animation: "pulse 1.5s infinite ease-in-out",
            }}
          />

          {/* Top Pill / Compatibility Score Skeleton */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: "0.25rem" }}>
            <div
              style={{
                height: "1.5rem",
                width: "55%",
                borderRadius: "9999px",
                backgroundColor: "#f8fafc",
                border: "1px solid #f1f5f9",
                animation: "pulse 1.5s infinite ease-in-out",
              }}
            />
          </div>

          {/* Name & Subtitle Skeleton */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.45rem", marginTop: "0.4rem" }}>
            <div
              style={{
                height: "1.35rem",
                width: "65%",
                borderRadius: "0.375rem",
                backgroundColor: "#e2e8f0",
                animation: "pulse 1.5s infinite ease-in-out",
              }}
            />
            <div
              style={{
                height: "0.85rem",
                width: "45%",
                borderRadius: "0.25rem",
                backgroundColor: "#f1f5f9",
                animation: "pulse 1.5s infinite ease-in-out",
              }}
            />
          </div>

          {/* Info Tags / Badges Skeleton */}
          <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem", flexWrap: "wrap", margin: "0.4rem 0" }}>
            <div style={{ height: "1.35rem", width: "3.8rem", borderRadius: "12px", backgroundColor: "#f8fafc", animation: "pulse 1.5s infinite ease-in-out" }} />
            <div style={{ height: "1.35rem", width: "4.8rem", borderRadius: "12px", backgroundColor: "#f8fafc", animation: "pulse 1.5s infinite ease-in-out" }} />
            <div style={{ height: "1.35rem", width: "4.2rem", borderRadius: "12px", backgroundColor: "#f8fafc", animation: "pulse 1.5s infinite ease-in-out" }} />
          </div>

          {/* Bio Line Skeletons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", padding: "0 0.5rem" }}>
            <div style={{ height: "0.75rem", width: "100%", borderRadius: "0.25rem", backgroundColor: "#f1f5f9", animation: "pulse 1.5s infinite ease-in-out" }} />
            <div style={{ height: "0.75rem", width: "80%", borderRadius: "0.25rem", backgroundColor: "#f1f5f9", animation: "pulse 1.5s infinite ease-in-out" }} />
          </div>

          {/* Bottom Action Button Skeleton */}
          <div
            style={{
              height: "2.85rem",
              width: "100%",
              borderRadius: "9999px",
              backgroundColor: "#fff7ed",
              border: "1.5px solid #ffedd5",
              marginTop: "auto",
              animation: "pulse 1.5s infinite ease-in-out",
            }}
          />
        </div>
      ))}
    </div>
  );
}
