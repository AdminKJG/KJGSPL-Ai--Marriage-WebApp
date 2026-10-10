import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ChangeEvent } from "react";
import { Button, Card, Input, Label, Text } from "@/components/ui";
import { SearchableDropdown } from "@/components/ui/SearchableDropdown";
import { ErrorState } from "@/components/ui";
import { MatrimonialDiscoveryCard } from "@/components/discovery/MatrimonialDiscoveryCard";
import { configQuery, connectionsQuery, discoveryApi, discoveryQuery, getLocalSavedIds, qk } from "@/lib/api/modules";
import { MASTER_EDUCATION, MASTER_OCCUPATION } from "@/lib/constants/masterData";

const EDUCATION_OPTIONS = MASTER_EDUCATION.map((e) => ({
  title: `${e.name} (${e.shortName})`,
  subtitle: `${e.field} • ${e.degreeLevel.replace("DEG_", "")}`,
  value: `${e.name} (${e.shortName})`,
}));

const OCCUPATION_OPTIONS = MASTER_OCCUPATION.map((o) => ({
  title: o.name,
  subtitle: o.description,
  value: o.name,
}));

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
  const [minAge, setMinAge] = useState<number | "">("");
  const [maxAge, setMaxAge] = useState<number | "">("");
  const [countryFilter, setCountryFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("All cities");
  const [educationFilter, setEducationFilter] = useState("");
  const [professionFilter, setProfessionFilter] = useState("");
  const [minIncome, setMinIncome] = useState<number | "">("");
  const [maxIncome, setMaxIncome] = useState<number | "">("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [maritalStatusFilter, setMaritalStatusFilter] = useState("");
  const [dietFilter, setDietFilter] = useState("");
  const [smokingFilter, setSmokingFilter] = useState("");
  const [drinkingFilter, setDrinkingFilter] = useState("");
  const [interestFilter, setInterestFilter] = useState("All interests");
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [sentInterests, setSentInterests] = useState<Set<string>>(new Set());

  const [appliedFilters, setAppliedFilters] = useState({
    minAge: "" as number | "",
    maxAge: "" as number | "",
    city: "All cities",
    education: "",
    profession: "",
    minIncome: "" as number | "",
    maxIncome: "" as number | "",
  });

  const applyFilters = () => {
    setAppliedFilters({
      minAge,
      maxAge,
      city: cityFilter,
      education: educationFilter,
      profession: professionFilter,
      minIncome,
      maxIncome,
    });
    setPage(1);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setMinAge("");
    setMaxAge("");
    setCityFilter("All cities");
    setEducationFilter("");
    setProfessionFilter("");
    setMinIncome("");
    setMaxIncome("");
    setAppliedFilters({
      minAge: "",
      maxAge: "",
      city: "All cities",
      education: "",
      profession: "",
      minIncome: "",
      maxIncome: "",
    });
    setPage(1);
  };

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
  const activeCity = appliedFilters.city === "All cities" ? "" : appliedFilters.city;
  const activeInterest = interestFilter === "All interests" ? "" : interestFilter;

  const { data, isLoading, error } = useQuery(
    discoveryQuery({
      page,
      limit: 10,
      minAge: appliedFilters.minAge,
      maxAge: appliedFilters.maxAge,
      city: activeCity,
      education: appliedFilters.education,
      profession: appliedFilters.profession,
      minIncome: appliedFilters.minIncome,
      maxIncome: appliedFilters.maxIncome,
    })
  );

  const activeFilterCount =
    (activeCity ? 1 : 0) +
    (appliedFilters.minAge || appliedFilters.maxAge ? 1 : 0) +
    (appliedFilters.education ? 1 : 0) +
    (appliedFilters.profession ? 1 : 0) +
    (appliedFilters.minIncome || appliedFilters.maxIncome ? 1 : 0);

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
          AI MATCHMAKING
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
              Verified profiles for a lifelong bond.
            </h1>
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem", color: "var(--muted-foreground, #78716c)" }}>
              {data?.remaining != null
                ? `${data.remaining} of 10 daily introductions remaining today`
                : "Curated AI recommendations based on shared values & long-term compatibility."}
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
            <span>⚡ Match Filters</span>
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

        {/* Active Filter Chips Bar */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginTop: "1rem" }}>
          {/* Quick Filter toggle button if no filters active */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
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

          {/* Age range chip */}
          {(appliedFilters.minAge || appliedFilters.maxAge) && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                padding: "0.35rem 0.75rem",
                borderRadius: "9999px",
                border: "1px solid #fecdd3",
                background: "#fff1f2",
                color: "#be123c",
                cursor: "pointer",
              }}
              onClick={() => {
                setMinAge("");
                setMaxAge("");
                setAppliedFilters((prev) => ({ ...prev, minAge: "", maxAge: "" }));
              }}
              title="Click to remove age filter"
            >
              🎂 {appliedFilters.minAge && appliedFilters.maxAge ? `${appliedFilters.minAge}–${appliedFilters.maxAge} yrs` : appliedFilters.minAge ? `${appliedFilters.minAge}+ yrs` : `Up to ${appliedFilters.maxAge} yrs`} ✕
            </span>
          )}

          {/* Education chip */}
          {appliedFilters.education && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                padding: "0.35rem 0.75rem",
                borderRadius: "9999px",
                border: "1px solid #cbd5e1",
                background: "#f1f5f9",
                color: "#334155",
                cursor: "pointer",
              }}
              onClick={() => {
                setEducationFilter("");
                setAppliedFilters((prev) => ({ ...prev, education: "" }));
              }}
            >
              🎓 {appliedFilters.education} ✕
            </span>
          )}

          {/* Profession chip */}
          {appliedFilters.profession && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                padding: "0.35rem 0.75rem",
                borderRadius: "9999px",
                border: "1px solid #cbd5e1",
                background: "#f1f5f9",
                color: "#334155",
                cursor: "pointer",
              }}
              onClick={() => {
                setProfessionFilter("");
                setAppliedFilters((prev) => ({ ...prev, profession: "" }));
              }}
            >
              💼 {appliedFilters.profession} ✕
            </span>
          )}

          {/* Income chip */}
          {(appliedFilters.minIncome || appliedFilters.maxIncome) && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                padding: "0.35rem 0.75rem",
                borderRadius: "9999px",
                border: "1px solid #bbf7d0",
                background: "#f0fdf4",
                color: "#166534",
                cursor: "pointer",
              }}
              onClick={() => {
                setMinIncome("");
                setMaxIncome("");
                setAppliedFilters((prev) => ({ ...prev, minIncome: "", maxIncome: "" }));
              }}
            >
              💰 ₹{appliedFilters.minIncome ? `${(Number(appliedFilters.minIncome) / 100000).toFixed(0)}L` : '0'}–{appliedFilters.maxIncome ? `₹${(Number(appliedFilters.maxIncome) / 100000).toFixed(0)}L` : 'Any'} ✕
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
                color: "#ef4444",
                fontWeight: 600,
                cursor: "pointer",
                padding: "0.35rem 0.5rem",
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Clean & Spacious Filter Panel */}
      {showFilters && (
        <Card
          variant="surface"
          style={{
            marginBottom: "2rem",
            padding: "2rem",
            borderRadius: "1.25rem",
            border: "1.5px solid #e2e8f0",
            background: "#ffffff",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div className="stack-6">
            {/* Header of Filter Panel */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "#1c1917" }}>
                    Filter Introductions
                  </h3>
                  {activeFilterCount > 0 && (
                    <span
                      style={{
                        background: "#fff1f2",
                        color: "#be123c",
                        border: "1px solid #fecdd3",
                        padding: "0.15rem 0.6rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      {activeFilterCount} Active
                    </span>
                  )}
                </div>
                <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem", color: "#64748b" }}>
                  Customize age range, location, education, occupation, and annual income.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowFilters(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "2.2rem",
                  height: "2.2rem",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Close filters"
              >
                ✕
              </button>
            </div>

            {/* 2-Column Grid Layout */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
              {/* 1. Age Range Dual Slider Block */}
              <div className="stack-2" style={{ background: "#f8fafc", padding: "1.25rem 1.5rem", borderRadius: "0.85rem", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Label style={{ fontSize: "0.875rem", fontWeight: 700, color: "#334155" }}>
                    🎂 AGE RANGE
                  </Label>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#991b1b" }}>
                    {minAge || 18} – {maxAge || 60} Years
                  </span>
                </div>

                {/* Range Slider Track */}
                <div style={{ position: "relative", height: "2.4rem", display: "flex", alignItems: "center", width: "100%", marginTop: "0.25rem" }}>
                  {/* Track Background */}
                  <div style={{ position: "absolute", left: 0, right: 0, height: "8px", borderRadius: "4px", background: "#cbd5e1" }} />
                  
                  {/* Active Highlight Track */}
                  <div
                    style={{
                      position: "absolute",
                      left: `${Math.max(0, Math.min(100, (((Number(minAge) || 18) - 18) / (70 - 18)) * 100))}%`,
                      right: `${Math.max(0, Math.min(100, 100 - (((Number(maxAge) || 60) - 18) / (70 - 18)) * 100))}%`,
                      height: "8px",
                      borderRadius: "4px",
                      background: "linear-gradient(90deg, #991b1b, #be123c)",
                    }}
                  />

                  {/* Dual Sliders */}
                  <input
                    type="range"
                    className="range-slider-input"
                    min={18}
                    max={70}
                    value={minAge || 18}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const currentMax = Number(maxAge) || 60;
                      if (val <= currentMax) {
                        setMinAge(val);
                      }
                    }}
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      margin: 0,
                      appearance: "none",
                      WebkitAppearance: "none",
                      background: "transparent",
                      pointerEvents: "auto",
                      cursor: "pointer",
                      zIndex: (Number(minAge) || 18) > 60 ? 5 : 3,
                    }}
                  />
                  <input
                    type="range"
                    className="range-slider-input"
                    min={18}
                    max={70}
                    value={maxAge || 60}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const currentMin = Number(minAge) || 18;
                      if (val >= currentMin) {
                        setMaxAge(val);
                      }
                    }}
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      margin: 0,
                      appearance: "none",
                      WebkitAppearance: "none",
                      background: "transparent",
                      pointerEvents: "auto",
                      cursor: "pointer",
                      zIndex: 4,
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b", marginTop: "-0.25rem" }}>
                  <span>18 yrs</span>
                  <span>70 yrs</span>
                </div>
              </div>

              {/* 2. City Autocomplete Block */}
              <div className="stack-2" style={{ background: "#f8fafc", padding: "1.25rem 1.5rem", borderRadius: "0.85rem", border: "1px solid #e2e8f0" }}>
                <Label htmlFor="filter-city" style={{ fontSize: "0.875rem", fontWeight: 700, color: "#334155" }}>
                  📍 CITY / LOCATION
                </Label>
                <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
                  <Input
                    id="filter-city"
                    placeholder="Search city (e.g. Mumbai, Delhi, Bangalore)..."
                    value={cityFilter === "All cities" ? "" : cityFilter}
                    onChange={handleCityChange}
                    style={{ paddingRight: "2.25rem", background: "#ffffff", width: "100%" }}
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
                        marginTop: "0.25rem"
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
                            borderBottom: "1px solid #f1f5f9",
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
              </div>

              {/* 3. Education Searchable Dropdown */}
              <div className="stack-2" style={{ background: "#f8fafc", padding: "1.25rem 1.5rem", borderRadius: "0.85rem", border: "1px solid #e2e8f0" }}>
                <SearchableDropdown
                  label="🎓 EDUCATION DEGREE"
                  value={educationFilter}
                  onChange={(val: string) => setEducationFilter(val)}
                  options={EDUCATION_OPTIONS}
                  placeholder="Search degree (e.g. B.Tech, MBA, MBBS)..."
                  endpoint="/v1/education"
                />
              </div>

              {/* 4. Profession / Occupation Searchable Dropdown */}
              <div className="stack-2" style={{ background: "#f8fafc", padding: "1.25rem 1.5rem", borderRadius: "0.85rem", border: "1px solid #e2e8f0" }}>
                <SearchableDropdown
                  label="💼 PROFESSION / OCCUPATION"
                  value={professionFilter}
                  onChange={(val: string) => setProfessionFilter(val)}
                  options={OCCUPATION_OPTIONS}
                  placeholder="Search occupation (e.g. Software Engineer)..."
                  endpoint="/v1/occupations"
                />
              </div>

              {/* 5. Annual Income Range (Full Width) */}
              <div className="stack-2" style={{ gridColumn: "1 / -1", background: "#f8fafc", padding: "1.25rem 1.5rem", borderRadius: "0.85rem", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                  <Label style={{ fontSize: "0.875rem", fontWeight: 700, color: "#334155" }}>
                    💰 ANNUAL INCOME RANGE (₹ RUPEES)
                  </Label>
                  {/* Quick Income Presets */}
                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                    {([
                      { label: "Any Income", min: "", max: "" },
                      { label: "< 5 LPA", min: "", max: 500000 },
                      { label: "5-10 LPA", min: 500000, max: 1000000 },
                      { label: "10-20 LPA", min: 1000000, max: 2000000 },
                      { label: "20-50 LPA", min: 2000000, max: 5000000 },
                      { label: "50+ LPA", min: 5000000, max: "" },
                    ] as const).map((inc) => {
                      const isSel = minIncome === inc.min && maxIncome === inc.max;
                      return (
                        <button
                          key={inc.label}
                          type="button"
                          onClick={() => { setMinIncome(inc.min); setMaxIncome(inc.max); }}
                          style={{
                            padding: "0.2rem 0.6rem",
                            borderRadius: "9999px",
                            border: isSel ? "1.5px solid #166534" : "1px solid #cbd5e1",
                            background: isSel ? "#f0fdf4" : "#ffffff",
                            color: isSel ? "#166534" : "#475569",
                            fontSize: "0.75rem",
                            fontWeight: isSel ? 700 : 500,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {inc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <DualRangeSlider minIncome={minIncome} maxIncome={maxIncome} setMinIncome={setMinIncome} setMaxIncome={setMaxIncome} />

                <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginTop: "1rem" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "0.85rem", fontWeight: 600 }}>₹</span>
                    <Input
                      type="number"
                      placeholder="Min Income (e.g. 500000)"
                      value={minIncome}
                      onChange={(e) => setMinIncome(e.target.value ? Number(e.target.value) : "")}
                      style={{ paddingLeft: "2rem", background: "#ffffff" }}
                    />
                  </div>
                  <span style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600 }}>to</span>
                  <div style={{ position: "relative", flex: 1 }}>
                    <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "0.85rem", fontWeight: 600 }}>₹</span>
                    <Input
                      type="number"
                      placeholder="Max Income (e.g. 2000000)"
                      value={maxIncome}
                      onChange={(e) => setMaxIncome(e.target.value ? Number(e.target.value) : "")}
                      style={{ paddingLeft: "2rem", background: "#ffffff" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9" }}>
              <Button
                variant="primary"
                onClick={applyFilters}
                style={{
                  borderRadius: "9999px",
                  padding: "0.75rem 2.25rem",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  background: "#991b1b",
                  color: "#ffffff",
                  boxShadow: "0 4px 14px rgba(153, 27, 27, 0.3)",
                }}
              >
                Apply Filters
              </Button>
              <Button
                variant="ghost"
                onClick={resetFilters}
                style={{ color: "#ef4444", fontWeight: 600, fontSize: "0.875rem" }}
              >
                Reset Filters
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

function DualRangeSlider({ minIncome, maxIncome, setMinIncome, setMaxIncome }: { minIncome: any, maxIncome: any, setMinIncome: any, setMaxIncome: any }) {
  const min = 0;
  const max = 10000000;
  
  const currentMin = typeof minIncome === "number" ? minIncome : min;
  const currentMax = typeof maxIncome === "number" && maxIncome !== 0 ? maxIncome : max;

  return (
    <div style={{ position: "relative", width: "100%", height: "24px", display: "flex", alignItems: "center", marginTop: "1.25rem", marginBottom: "0.25rem" }}>
      <div style={{ position: "absolute", left: 0, right: 0, height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px" }} />
      <div style={{ 
        position: "absolute", 
        left: `${((currentMin - min) / (max - min)) * 100}%`, 
        right: `${100 - ((currentMax - min) / (max - min)) * 100}%`, 
        height: "6px", 
        backgroundColor: "var(--rose-active)", 
        borderRadius: "3px" 
      }} />
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={100000}
        value={currentMin} 
        onChange={(e) => {
           const val = Number(e.target.value);
           if (val <= currentMax - 100000) setMinIncome(val === 0 ? "" : val);
        }}
        style={{ position: "absolute", width: "100%", appearance: "none", background: "transparent", pointerEvents: "none", zIndex: 3 }}
        className="dual-slider-thumb"
      />
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={100000}
        value={currentMax} 
        onChange={(e) => {
           const val = Number(e.target.value);
           if (val >= currentMin + 100000) setMaxIncome(val === max ? "" : val);
        }}
        style={{ position: "absolute", width: "100%", appearance: "none", background: "transparent", pointerEvents: "none", zIndex: 4 }}
        className="dual-slider-thumb"
      />
    </div>
  );
}
