import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect, type ChangeEvent } from "react";
import { Button, Card, Input, Label, Text } from "@/components/ui";
import { ErrorState, LoadingState, StateMessage } from "@/components/ui";
import { MatrimonialDiscoveryCard } from "@/components/discovery/MatrimonialDiscoveryCard";
import { discoveryQuery, profileApi, qk } from "@/lib/api/modules";
import { useAppSelector } from "@/store";

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

function DiscoverPage() {
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [religionFilter, setReligionFilter] = useState("");
  const [dietFilter, setDietFilter] = useState("");
  const [minAge, setMinAge] = useState<number | "">("");
  const [maxAge, setMaxAge] = useState<number | "">("");
  const [sentInterests, setSentInterests] = useState<Set<string>>(new Set());

  const navigate = useNavigate();
  const qc = useQueryClient();
  const config = useAppSelector((state) => state.config);
  const { data, isLoading, error } = useQuery(discoveryQuery(page));

  const interest = useMutation({
    mutationFn: profileApi.interest,
    onSuccess: (_res, profileId) => {
      setSentInterests((prev) => new Set(prev).add(profileId));
      qc.invalidateQueries({ queryKey: qk.connections });
      qc.invalidateQueries({ queryKey: qk.discovery });
    },
  });

  const religionOptions = config.culturalFields?.religion?.options ?? [
    "Hindu",
    "Muslim",
    "Sikh",
    "Christian",
    "Jain",
    "Buddhist",
    "Parsi",
    "Jewish",
    "Spiritual",
    "Other",
  ];

  const dietOptions = config.culturalFields?.diet?.options ?? [
    "Vegetarian",
    "Non-Vegetarian",
    "Eggetarian",
    "Vegan",
    "Jain",
    "Halal",
  ];

  // Client-side filtering over discovery batch
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesBio = p.bio?.toLowerCase().includes(q);
        const matchesOcc = p.occupation?.toLowerCase().includes(q);
        const matchesCity = p.city?.toLowerCase().includes(q);
        if (!matchesName && !matchesBio && !matchesOcc && !matchesCity) return false;
      }
      if (cityFilter.trim() && p.city && !p.city.toLowerCase().includes(cityFilter.toLowerCase())) {
        return false;
      }
      if (genderFilter && p.gender && p.gender.toLowerCase() !== genderFilter.toLowerCase()) {
        return false;
      }
      if (minAge !== "" && p.age != null && p.age < minAge) {
        return false;
      }
      if (maxAge !== "" && p.age != null && p.age > maxAge) {
        return false;
      }
      const cult = p.cultural as Record<string, string> | undefined;
      if (religionFilter && cult?.religion && cult.religion.toLowerCase() !== religionFilter.toLowerCase()) {
        return false;
      }
      if (dietFilter && cult?.diet && cult.diet.toLowerCase() !== dietFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [data?.items, searchQuery, cityFilter, genderFilter, minAge, maxAge, religionFilter, dietFilter]);

  const activeFilterCount = [
    searchQuery,
    cityFilter,
    genderFilter,
    religionFilter,
    dietFilter,
    minAge !== "",
    maxAge !== "",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchQuery("");
    setCityFilter("");
    setGenderFilter("");
    setReligionFilter("");
    setDietFilter("");
    setMinAge("");
    setMaxAge("");
  };

  return (
    <div className="discover-page-wrapper">

      {/* Filter Panel */}
      {showFilters && (
        <Card variant="surface" style={{ marginBottom: "1.25rem" }}>
          <div className="stack-4">
            <div className="row-2 between wrap">
              <Text variant="strong">Refine Candidates</Text>
              {activeFilterCount > 0 && (
                <Button size="sm" variant="ghost" onClick={resetFilters}>
                  Clear all filters
                </Button>
              )}
            </div>

            <div className="grid-2">
              <div className="stack-1">
                <Label htmlFor="filter-search">Search Keyword</Label>
                <Input
                  id="filter-search"
                  placeholder="Name, occupation, keyword..."
                  value={searchQuery}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="stack-1">
                <Label htmlFor="filter-city">City / Location</Label>
                <Input
                  id="filter-city"
                  placeholder="e.g. Mumbai, Delhi, Bengaluru..."
                  value={cityFilter}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCityFilter(e.target.value)}
                />
              </div>

              <div className="row-2">
                <div className="stack-1 grow">
                  <Label htmlFor="filter-min-age">Min Age</Label>
                  <Input
                    id="filter-min-age"
                    type="number"
                    min={18}
                    max={100}
                    placeholder="18"
                    value={minAge}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setMinAge(e.target.value ? Number(e.target.value) : "")}
                  />
                </div>
                <div className="stack-1 grow">
                  <Label htmlFor="filter-max-age">Max Age</Label>
                  <Input
                    id="filter-max-age"
                    type="number"
                    min={18}
                    max={100}
                    placeholder="60"
                    value={maxAge}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setMaxAge(e.target.value ? Number(e.target.value) : "")}
                  />
                </div>
              </div>

              <div className="stack-1">
                <Label htmlFor="filter-gender">Gender</Label>
                <select
                  id="filter-gender"
                  className="ds-input"
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  style={{ padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid var(--border, #ccc)" }}
                >
                  <option value="">All Genders</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non-binary">Non-binary</option>
                </select>
              </div>

              <div className="stack-1">
                <Label htmlFor="filter-religion">Religion / Faith</Label>
                <select
                  id="filter-religion"
                  className="ds-input"
                  value={religionFilter}
                  onChange={(e) => setReligionFilter(e.target.value)}
                  style={{ padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid var(--border, #ccc)" }}
                >
                  <option value="">All Religions</option>
                  {religionOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="stack-1">
                <Label htmlFor="filter-diet">Dietary Preference</Label>
                <select
                  id="filter-diet"
                  className="ds-input"
                  value={dietFilter}
                  onChange={(e) => setDietFilter(e.target.value)}
                  style={{ padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid var(--border, #ccc)" }}
                >
                  <option value="">All Diets</option>
                  {dietOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row-2 between wrap" style={{ paddingTop: "0.5rem", borderTop: "1px solid var(--border, #eee)" }}>
              <Text variant="caption">
                Showing {filteredItems.length} of {data?.items.length ?? 0} candidates on this page
              </Text>
            </div>
          </div>
        </Card>
      )}

      {isLoading && <LoadingState />}
      {error && <ErrorState error={error} />}

      {data && filteredItems.length === 0 && (
        <StateMessage title="No matching profiles">
          {activeFilterCount > 0
            ? "Try loosening your filters above to see more candidate profiles."
            : data.reason ?? "Check back tomorrow."}
        </StateMessage>
      )}

      {/* 3-Column Scrollable Discovery Grid (3 cards per row, scroll down for more) */}
      {filteredItems.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "100%" }}>
          <div className="discover-grid-3cols">
            {filteredItems.map((candidate) => (
              <MatrimonialDiscoveryCard
                key={candidate.id}
                profile={candidate}
                onSendInterest={(id) => interest.mutate(id)}
                isSendingInterest={interest.isPending && interest.variables === candidate.id}
                interestSent={sentInterests.has(candidate.id)}
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
                ← Previous Page
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
                Next Page →
              </button>
            </div>
          ) : null}
        </div>
      )}

      {interest.error && (
        <p className="ds-field__hint ds-field__hint--error" role="alert" style={{ textAlign: "center", marginTop: "0.5rem" }}>
          {interest.error.message}
        </p>
      )}
    </div>
  );
}

