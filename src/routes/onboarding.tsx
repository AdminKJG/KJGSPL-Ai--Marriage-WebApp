import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Badge, Button, Card, Field, Heading, Label, Text, Textarea } from "@/components/ui";
import { SearchableDropdown } from "@/components/ui/SearchableDropdown";
import { authApi, mediaApi, meQuery, profileApi, qk } from "@/lib/api/modules";
import { tokenStore } from "@/lib/api/client";
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

const VALUE_OPTIONS = [
  "Kindness",
  "Family",
  "Honesty",
  "Ambition",
  "Empathy",
  "Creativity",
  "Financial Responsibility",
  "Emotional Intelligence",
  "Growth Mindset",
  "Respect",
];

export interface OnboardingSearch {
  name?: string;
  dob?: string;
  email?: string;
  password?: string;
}

export const Route = createFileRoute("/onboarding")({
  validateSearch: (search: Record<string, unknown>): OnboardingSearch => ({
    name: typeof search.name === "string" ? search.name : undefined,
    dob: typeof search.dob === "string" ? search.dob : undefined,
    email: typeof search.email === "string" ? search.email : undefined,
    password: typeof search.password === "string" ? search.password : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Onboarding Wizard — AI Marriage" },
      { name: "description", content: "Complete your member profile setup in 7 simple steps." },
    ],
  }),
  component: OnboardingPage,
});

// City Search helper using Komoot Photon API
async function fetchCities(q: string): Promise<string[]> {
  if (!q || q.trim().length < 2) return [];
  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q.trim())}&osm_tag=place:city&limit=5&lang=en`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.features || !Array.isArray(data.features)) return [];
    return data.features
      .map((f: any) => {
        const p = f.properties || {};
        const parts = [p.name, p.state, p.country].filter(Boolean);
        return parts.join(", ");
      })
      .filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i);
  } catch {
    return [];
  }
}

// Reusable City Autocomplete Input
function CitySearchInput({
  label,
  value,
  onChange,
  placeholder = "Type city name (e.g. Mumbai, Delhi)...",
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const cities = await fetchCities(query);
      setResults(cities);
      setLoading(false);
      setShowDropdown(cities.length > 0);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="ds-field" style={{ position: "relative" }}>
      <Label>{label}</Label>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => {
          if (results.length > 0) setShowDropdown(true);
        }}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "0.75rem 1rem",
          borderRadius: "10px",
          border: "1px solid var(--border)",
          background: "var(--card)",
          color: "inherit",
          fontFamily: "inherit",
          fontSize: "0.95rem",
        }}
      />
      {loading && (
        <span style={{ position: "absolute", right: "1rem", top: "2.3rem", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
          Searching...
        </span>
      )}
      {showDropdown && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 30,
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            marginTop: "0.25rem",
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {results.map((c) => (
            <div
              key={c}
              onClick={() => {
                setQuery(c);
                onChange(c);
                setShowDropdown(false);
              }}
              style={{
                padding: "0.6rem 1rem",
                fontSize: "0.875rem",
                cursor: "pointer",
                borderBottom: "1px solid var(--border)",
                color: "var(--ink)",
              }}
            >
              📍 {c}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function calcAgeFromDob(dobStr?: string) {
  if (!dobStr) return "27";
  const d = new Date(dobStr);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
  return String(age > 0 ? age : 27);
}

function OnboardingPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const qc = useQueryClient();
  const hasToken = typeof window !== "undefined" && Boolean(tokenStore.getAccess());
  const { data: me } = useQuery({ ...meQuery(), enabled: hasToken });

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If onboarding is already completed, send user directly to /discover
  useEffect(() => {
    if (me && ((me as any).onboardingComplete === true || (me as any).onboarding?.complete === true)) {
      navigate({ to: "/discover", replace: true });
    }
  }, [me, navigate]);

  // Form State across 7 steps matching ONBOARDING_API_DOCS.md
  const [form, setForm] = useState({
    // Step 1: Basic Info
    name: search.name || "",
    dateOfBirth: search.dob || "",
    age: search.dob ? calcAgeFromDob(search.dob) : "",
    gender: "woman",
    education: "",
    occupation: "",

    // Step 2: Intentions
    intentions: ["long_term"],

    // Step 3: Location
    city: "",
    locationWillingness: "Open to moving",
    settlementCities: [] as string[],

    // Step 4: Lifestyle & Daily Rhythms
    rhythm: "Early mornings",

    // Step 5: Values & Family
    values: ["Kindness", "Family"] as string[],
    family: "Hope to have children",

    // Step 6: Partner Preferences & Boundaries
    partnerCities: [] as string[],
    minAge: 25,
    maxAge: 40,
    boundaries: "",

    // Step 7: Media, Bio & Visibility
    photoBase64: null as string | null,
    photoPreview: null as string | null,
    bio: "",
    matchingConsent: true,
    visibility: "visible",
  });

  useEffect(() => {
    if (me) {
      setForm((prev) => ({
        ...prev,
        name: me.name || prev.name,
        city: me.city || prev.city,
        education: me.education || prev.education,
        occupation: me.occupation || prev.occupation,
        bio: me.bio || prev.bio,
        age: String(me.age || prev.age),
      }));
    }
  }, [me]);

  const update = (key: string, val: any) => {
    setForm((p) => ({ ...p, [key]: val }));
  };

  const toggleValue = (val: string) => {
    setForm((p) => {
      const exists = p.values.includes(val);
      const next = exists ? p.values.filter((v) => v !== val) : [...p.values, val];
      return { ...p, values: next };
    });
  };

  const toggleIntention = (intentId: string) => {
    setForm((p) => {
      const exists = p.intentions.includes(intentId);
      const next = exists ? p.intentions.filter((i) => i !== intentId) : [...p.intentions, intentId];
      return { ...p, intentions: next.length > 0 ? next : ["long_term"] };
    });
  };

  const handlePhotoSelect = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result);
      setForm((p) => ({ ...p, photoBase64: res, photoPreview: res }));
    };
    reader.readAsDataURL(file);
  };

  const addSettlementCity = (city: string) => {
    if (!city || form.settlementCities.includes(city)) return;
    setForm((p) => ({ ...p, settlementCities: [...p.settlementCities, city] }));
  };

  const removeSettlementCity = (city: string) => {
    setForm((p) => ({ ...p, settlementCities: p.settlementCities.filter((c) => c !== city) }));
  };

  const addPartnerCity = (city: string) => {
    if (!city || form.partnerCities.includes(city)) return;
    setForm((p) => ({ ...p, partnerCities: [...p.partnerCities, city] }));
  };

  const removePartnerCity = (city: string) => {
    setForm((p) => ({ ...p, partnerCities: p.partnerCities.filter((c) => c !== city) }));
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      // 1. Photo Upload if selected (POST /v1/media/photos)
      if (form.photoBase64) {
        const rawBase64 = form.photoBase64.includes(",") ? form.photoBase64.split(",")[1] : form.photoBase64;
        await mediaApi.upload(rawBase64).catch((e) => console.warn("Photo upload warning:", e));
      }

      // 2. Batch PATCH /v1/me payload according to Section 6.1 of AUTH_AND_PROFILE_ONBOARDING_FRONTEND_API_DOCS.md
      await profileApi.updateMe({
        name: form.name,
        gender: form.gender as any,
        city: form.city || "Mumbai, Maharashtra, India",
        dateOfBirth: form.dateOfBirth,
        education: form.education,
        occupation: form.occupation,
        bio: form.bio,
        interests: ["technology", "travel", "mindful living"],
        values: form.values,
        lifestyle: [form.rhythm].filter(Boolean),
        languages: ["English", "Hindi"],
        futurePlans: form.family || "",
        intention: form.intentions[0] || "A path towards marriage",
        adultConfirmed: true,
        matchingConsent: true,
        onboardingComplete: true,
        visibility: form.visibility as any,
        preferences: {
          minAge: Number(form.minAge) || 22,
          maxAge: Number(form.maxAge) || 40,
          city: form.partnerCities[0] || form.city || "Mumbai",
          settlementCities: form.settlementCities,
        },
        settings: {
          notifications: true,
          visibility: form.visibility as any,
        },
      } as any);

        qc.invalidateQueries({ queryKey: qk.me });
        qc.invalidateQueries({ queryKey: ["session"] });
        navigate({ to: "/discover", replace: true });
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to complete onboarding. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background, #faf7f5)", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "1050px", margin: "0 auto", width: "100%" }}>
        {/* Top Branding Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "2rem" }}>
          <img src="/assets/ai_marriage_logo.png" alt="AI Marriage Logo" style={{ height: "42px", objectFit: "contain" }} />
          <span style={{ fontSize: "1.4rem", fontFamily: "serif", fontWeight: 700, color: "var(--ink, #1f2937)" }}>
            <span style={{ color: "#e11d48", fontWeight: 800 }}>AI</span> Marriage
          </span>
        </div>

        {/* Step Header Indicator */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--rose-active, #e11d48)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Step {step} of 7
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--muted-foreground, #6b7280)" }}>
              {step === 1 && "A little about you (Basic Info)"}
              {step === 2 && "What brings you here (Intentions)"}
              {step === 3 && "Where life happens (Location)"}
              {step === 4 && "Your kind of everyday (Lifestyle)"}
              {step === 5 && "What matters most (Values & Family)"}
              {step === 6 && "Room for your boundaries (Partner Preferences)"}
              {step === 7 && "Make it feel like you (Media, Bio & Submit)"}
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ height: "6px", background: "var(--border, #e5e7eb)", borderRadius: "999px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${(step / 7) * 100}%`,
                background: "linear-gradient(90deg, var(--rose-active, #e11d48) 0%, #f43f5e 100%)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        <Card variant="surface" style={{ padding: "2.25rem 2.5rem", borderRadius: "18px", border: "1px solid var(--border, #e5e7eb)", boxShadow: "0 4px 24px rgba(0, 0, 0, 0.03)" }}>
          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div className="stack-4">
              <div>
                <Heading level="h2" style={{ fontSize: "1.6rem", margin: 0 }}>
                  A little about you 👋
                </Heading>
                <Text variant="small" style={{ color: "var(--muted-foreground, #6b7280)", marginTop: "0.25rem" }}>
                  Basic details to build your candidate profile foundation.
                </Text>
              </div>

              <Field
                id="name"
                label="Full Name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Aarav Sharma"
              />

              <div className="grid-2">
                <Field
                  id="dob"
                  label="Date of Birth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => update("dateOfBirth", e.target.value)}
                />
                <Field
                  id="age"
                  label="Age"
                  type="number"
                  value={form.age}
                  onChange={(e) => update("age", e.target.value)}
                  placeholder="27"
                />
              </div>

              <div className="ds-field">
                <Label>Gender</Label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginTop: "0.5rem" }}>
                  {[
                    { id: "woman", label: "Woman" },
                    { id: "man", label: "Man" },
                    { id: "non-binary", label: "Non-binary" },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => update("gender", g.id)}
                      style={{
                        padding: "0.75rem",
                        borderRadius: "10px",
                        border: form.gender === g.id ? "2px solid var(--rose-active, #e11d48)" : "1px solid var(--border, #e5e7eb)",
                        background: form.gender === g.id ? "rgba(225, 29, 72, 0.1)" : "var(--card, #fff)",
                        color: form.gender === g.id ? "var(--rose-active, #e11d48)" : "var(--ink, #1f2937)",
                        fontWeight: form.gender === g.id ? 700 : 500,
                        cursor: "pointer",
                      }}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid-2">
                <SearchableDropdown
                  id="education"
                  label="Education Level / Degree"
                  value={form.education}
                  onChange={(val: string) => update("education", val)}
                  options={EDUCATION_OPTIONS}
                  placeholder="Select degree or type custom education..."
                  endpoint="/v1/education"
                />
                <SearchableDropdown
                  id="occupation"
                  label="Occupation / Job Role"
                  value={form.occupation}
                  onChange={(val: string) => update("occupation", val)}
                  options={OCCUPATION_OPTIONS}
                  placeholder="Select role or type custom occupation..."
                  endpoint="/v1/occupations"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Relationship Intentions */}
          {step === 2 && (
            <div className="stack-4">
              <div>
                <Heading level="h2" style={{ fontSize: "1.6rem", margin: 0 }}>
                  What brings you here? 💖
                </Heading>
                <Text variant="small" style={{ color: "var(--muted-foreground, #6b7280)", marginTop: "0.25rem" }}>
                  Define what kind of connection you seek on AI Marriage.
                </Text>
              </div>

              <div className="ds-field">
                <Label>Primary Intentions (Select all that apply)</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                  {[
                    { id: "marriage", title: "Active Marriage Search (Within 1-2 Yrs)", desc: "Ready to settle down soon with family alignment." },
                    { id: "long_term", title: "Marriage / Long-term Life Partnership", desc: "Looking for a lifetime commitment with shared values." },
                    { id: "open_to_dating", title: "Thoughtful Dating with Intent", desc: "Getting to know someone deeply before deciding." },
                  ].map((intent) => {
                    const isSelected = form.intentions.includes(intent.id);
                    return (
                      <div
                        key={intent.id}
                        onClick={() => toggleIntention(intent.id)}
                        style={{
                          padding: "0.85rem 1rem",
                          borderRadius: "12px",
                          border: isSelected ? "2px solid var(--rose-active, #e11d48)" : "1px solid var(--border, #e5e7eb)",
                          background: isSelected ? "rgba(225, 29, 72, 0.08)" : "var(--card, #fff)",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ fontWeight: 600, color: isSelected ? "var(--rose-active, #e11d48)" : "var(--ink, #1f2937)" }}>
                          {intent.title} {isSelected ? "✓" : ""}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--muted-foreground, #6b7280)", marginTop: "0.2rem" }}>
                          {intent.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Location & Cities */}
          {step === 3 && (
            <div className="stack-4">
              <div>
                <Heading level="h2" style={{ fontSize: "1.6rem", margin: 0 }}>
                  Where life happens 📍
                </Heading>
                <Text variant="small" style={{ color: "var(--muted-foreground, #6b7280)", marginTop: "0.25rem" }}>
                  Specify your current city and settlement preferences.
                </Text>
              </div>

              <CitySearchInput
                label="Current City"
                value={form.city}
                onChange={(val) => update("city", val)}
                placeholder="Start typing your city..."
              />

              <div className="ds-field">
                <Label>Relocation & Location Willingness</Label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {["Stay in my city", "Open to moving", "Let’s discuss it"].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => update("locationWillingness", w)}
                      style={{
                        padding: "0.65rem",
                        borderRadius: "8px",
                        border: form.locationWillingness === w ? "2px solid var(--rose-active, #e11d48)" : "1px solid var(--border, #e5e7eb)",
                        background: form.locationWillingness === w ? "rgba(225, 29, 72, 0.1)" : "var(--card, #fff)",
                        color: form.locationWillingness === w ? "var(--rose-active, #e11d48)" : "var(--ink, #1f2937)",
                        fontWeight: form.locationWillingness === w ? 700 : 500,
                        cursor: "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ds-field">
                <Label>Settlement Cities (Locations you consider settling in)</Label>
                <CitySearchInput
                  label="Add Settlement City"
                  value=""
                  onChange={(val) => {
                    if (val && val.length > 3) addSettlementCity(val);
                  }}
                  placeholder="Type and select cities..."
                />

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                  {form.settlementCities.map((c) => (
                    <span
                      key={c}
                      style={{
                        padding: "0.35rem 0.75rem",
                        borderRadius: "999px",
                        background: "rgba(225, 29, 72, 0.12)",
                        color: "var(--rose-active, #e11d48)",
                        fontSize: "0.825rem",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      📍 {c}
                      <button
                        type="button"
                        onClick={() => removeSettlementCity(c)}
                        style={{ border: "none", background: "none", color: "inherit", cursor: "pointer", fontWeight: "bold" }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Lifestyle & Daily Rhythms */}
          {step === 4 && (
            <div className="stack-4">
              <div>
                <Heading level="h2" style={{ fontSize: "1.6rem", margin: 0 }}>
                  Your kind of everyday ☀️
                </Heading>
                <Text variant="small" style={{ color: "var(--muted-foreground, #6b7280)", marginTop: "0.25rem" }}>
                  Everyday rhythm helps match compatible lifestyle habits.
                </Text>
              </div>

              <div className="ds-field">
                <Label>Everyday Rhythm</Label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", marginTop: "0.5rem" }}>
                  {[
                    "Early mornings",
                    "Slow evenings",
                    "A bit of both",
                    "Prefer not to answer",
                  ].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => update("rhythm", r)}
                      style={{
                        padding: "0.85rem",
                        borderRadius: "10px",
                        border: form.rhythm === r ? "2px solid var(--rose-active, #e11d48)" : "1px solid var(--border, #e5e7eb)",
                        background: form.rhythm === r ? "rgba(225, 29, 72, 0.1)" : "var(--card, #fff)",
                        color: form.rhythm === r ? "var(--rose-active, #e11d48)" : "var(--ink, #1f2937)",
                        fontWeight: form.rhythm === r ? 700 : 500,
                        cursor: "pointer",
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Values & Family Plans */}
          {step === 5 && (
            <div className="stack-4">
              <div>
                <Heading level="h2" style={{ fontSize: "1.6rem", margin: 0 }}>
                  What matters most ✨
                </Heading>
                <Text variant="small" style={{ color: "var(--muted-foreground, #6b7280)", marginTop: "0.25rem" }}>
                  Share your core values and family expectations.
                </Text>
              </div>

              <div className="ds-field">
                <Label>Core Values (Select your top values)</Label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {VALUE_OPTIONS.map((val) => {
                    const selected = form.values.includes(val);
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => toggleValue(val)}
                        style={{
                          padding: "0.5rem 0.9rem",
                          borderRadius: "999px",
                          border: selected ? "2px solid var(--rose-active, #e11d48)" : "1px solid var(--border, #e5e7eb)",
                          background: selected ? "rgba(225, 29, 72, 0.12)" : "var(--card, #fff)",
                          color: selected ? "var(--rose-active, #e11d48)" : "var(--ink, #1f2937)",
                          fontWeight: selected ? 700 : 500,
                          cursor: "pointer",
                          fontSize: "0.85rem",
                        }}
                      >
                        {val} {selected ? "✓" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="ds-field">
                <Label>Family Plans</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {[
                    "Hope to have children",
                    "Do not plan to have children",
                    "Still considering",
                    "Prefer not to answer",
                  ].map((fam) => (
                    <button
                      key={fam}
                      type="button"
                      onClick={() => update("family", fam)}
                      style={{
                        padding: "0.75rem 1rem",
                        textAlign: "left",
                        borderRadius: "10px",
                        border: form.family === fam ? "2px solid var(--rose-active, #e11d48)" : "1px solid var(--border, #e5e7eb)",
                        background: form.family === fam ? "rgba(225, 29, 72, 0.08)" : "var(--card, #fff)",
                        color: form.family === fam ? "var(--rose-active, #e11d48)" : "var(--ink, #1f2937)",
                        fontWeight: form.family === fam ? 700 : 500,
                        cursor: "pointer",
                      }}
                    >
                      {fam}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Partner Preferences & Boundaries */}
          {step === 6 && (
            <div className="stack-4">
              <div>
                <Heading level="h2" style={{ fontSize: "1.6rem", margin: 0 }}>
                  Room for your boundaries 🎯
                </Heading>
                <Text variant="small" style={{ color: "var(--muted-foreground, #6b7280)", marginTop: "0.25rem" }}>
                  Specify target age range, partner locations, and personal boundaries.
                </Text>
              </div>

              <div className="grid-2">
                <Field
                  id="minAge"
                  label="Partner Minimum Age"
                  type="number"
                  value={form.minAge}
                  onChange={(e) => update("minAge", e.target.value)}
                />
                <Field
                  id="maxAge"
                  label="Partner Maximum Age"
                  type="number"
                  value={form.maxAge}
                  onChange={(e) => update("maxAge", e.target.value)}
                />
              </div>

              <div className="ds-field">
                <Label>Preferred Partner Cities (Leave empty for All Cities)</Label>
                <CitySearchInput
                  label="Search Partner City"
                  value=""
                  onChange={(val) => {
                    if (val && val.length > 3) addPartnerCity(val);
                  }}
                  placeholder="Type and select partner preferred cities..."
                />

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                  {form.partnerCities.map((c) => (
                    <span
                      key={c}
                      style={{
                        padding: "0.35rem 0.75rem",
                        borderRadius: "999px",
                        background: "rgba(225, 29, 72, 0.12)",
                        color: "var(--rose-active, #e11d48)",
                        fontSize: "0.825rem",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      📍 {c}
                      <button
                        type="button"
                        onClick={() => removePartnerCity(c)}
                        style={{ border: "none", background: "none", color: "inherit", cursor: "pointer", fontWeight: "bold" }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="ds-field">
                <Label htmlFor="boundaries">Personal Boundaries / Dealbreakers (Optional)</Label>
                <Textarea
                  id="boundaries"
                  rows={3}
                  value={form.boundaries}
                  onChange={(e) => update("boundaries", e.target.value)}
                  placeholder="Mention any specific boundaries or dealbreakers..."
                />
              </div>
            </div>
          )}

          {/* STEP 7: Profile Media, Bio & Final Submission */}
          {step === 7 && (
            <div className="stack-4">
              <div>
                <Heading level="h2" style={{ fontSize: "1.6rem", margin: 0 }}>
                  Make it feel like you 📸
                </Heading>
                <Text variant="small" style={{ color: "var(--muted-foreground, #6b7280)", marginTop: "0.25rem" }}>
                  Add your photo, short bio, and confirm visibility before starting.
                </Text>
              </div>

              <div style={{ textAlign: "center", padding: "1.5rem", border: "2px dashed var(--border, #e5e7eb)", borderRadius: "16px", background: "var(--card, #fff)" }}>
                {form.photoPreview ? (
                  <div className="stack-3" style={{ alignItems: "center" }}>
                    <img
                      src={form.photoPreview}
                      alt="Preview"
                      style={{ width: "130px", height: "130px", borderRadius: "50%", objectFit: "cover", margin: "0 auto", border: "3px solid var(--rose-active, #e11d48)" }}
                    />
                    <div className="row-2 wrap" style={{ justifyContent: "center" }}>
                      <Button size="sm" variant="outline" onClick={() => update("photoPreview", null)}>
                        Remove & choose another
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="stack-3" style={{ alignItems: "center" }}>
                    <div style={{ fontSize: "2.5rem" }}>📷</div>
                    <Text variant="strong">Drag & drop or click to upload photo</Text>
                    <Text variant="caption" style={{ color: "var(--muted-foreground, #6b7280)" }}>
                      JPG, PNG, or WebP up to 10MB
                    </Text>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
                      style={{ marginTop: "0.5rem" }}
                    />
                  </div>
                )}
              </div>

              <div className="ds-field">
                <Label htmlFor="bio">About You (Bio)</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  value={form.bio}
                  onChange={(e) => update("bio", e.target.value)}
                  placeholder="Share a short snippet about your personality, hobbies, and outlook on life..."
                />
              </div>

              {/* Profile Overview Card */}
              <div style={{ background: "var(--background, #faf7f5)", border: "1px solid var(--border, #e5e7eb)", borderRadius: "12px", padding: "1.25rem" }}>
                <Text variant="strong" style={{ display: "block", marginBottom: "0.75rem" }}>
                  Summary of your responses:
                </Text>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem", fontSize: "0.875rem" }}>
                  <div><strong>Name:</strong> {form.name}</div>
                  <div><strong>Age / DOB:</strong> {form.age} yrs ({form.dateOfBirth})</div>
                  <div><strong>Gender:</strong> {form.gender}</div>
                  <div><strong>Location:</strong> {form.city}</div>
                  <div><strong>Occupation:</strong> {form.occupation}</div>
                  <div><strong>Education:</strong> {form.education}</div>
                  <div><strong>Values:</strong> {form.values.join(", ")}</div>
                  <div><strong>Family:</strong> {form.family}</div>
                  <div><strong>Target Age:</strong> {form.minAge} - {form.maxAge} yrs</div>
                  <div><strong>Everyday Rhythm:</strong> {form.rhythm}</div>
                </div>
              </div>

              {errorMsg && (
                <p className="ds-field__hint ds-field__hint--error" role="alert">
                  {errorMsg}
                </p>
              )}
            </div>
          )}

          {/* Wizard Footer Navigation Buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--border, #e5e7eb)" }}>
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={submitting}>
                ← Back
              </Button>
            ) : (
              <div />
            )}

            {step < 7 ? (
              <Button variant="rose" onClick={() => setStep((s) => s + 1)}>
                Continue →
              </Button>
            ) : (
              <Button
                variant="rose"
                loading={submitting}
                disabled={submitting}
                onClick={handleFinalSubmit}
                style={{
                  background: "linear-gradient(135deg, var(--rose-active, #e11d48) 0%, #f43f5e 100%)",
                  fontWeight: 700,
                  padding: "0.75rem 1.75rem",
                }}
              >
                🚀 Begin your discovery
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
