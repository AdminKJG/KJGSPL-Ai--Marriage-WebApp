import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, Heading, Label, Text, Textarea } from "@/components/ui";
import { SearchableDropdown } from "@/components/ui/SearchableDropdown";
import { ErrorState, Field, LoadingState, PageHeader } from "@/components/ui";
import { CrownIcon, GearIcon, ShieldCheckIcon, SparklesIcon } from "@/components/icons/NavIcons";
import { aiApi, galleryQuery, mediaApi, meQuery, profileApi, qk } from "@/lib/api/modules";
import { photoUrl } from "@/lib/api/client";
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


export const Route = createFileRoute("/_member/me")({
  head: () => ({
    meta: [
      { title: "My profile — AI Marriage" },
      { name: "description", content: "Edit your profile details and photos." },
      { property: "og:title", content: "My profile — AI Marriage" },
      { property: "og:description", content: "Edit your profile details and photos." },
    ],
  }),
  component: MePage,
});

const TOPICS = [
  { id: "marriage_timing", label: "Marriage Timing", icon: "💍", options: ["Within 1 year", "1-2 years", "2-3 years", "Not sure yet"] },
  { id: "children", label: "Children", icon: "👶", options: ["Want someday", "Do not want", "Have & want more", "Have & do not want more"] },
    { id: "shared_activities", label: "Travel", icon: "🏖️", options: ["Frequent traveler", "Occasional vacations", "Prefer staying home"] },

  { id: "smoking", label: "Smoking", icon: "🚭", options: ["Never", "Occasionally", "Regularly"] },
  { id: "career_partnership", label: "Career Ambition", icon: "💼", options: ["Very ambitious", "Balanced", "Work to live"] },
  { id: "money_management", label: "Finances", icon: "💰", options: ["Saver", "Balanced", "Spender"] },
  { id: "social_rhythm", label: "Social Life", icon: "🏡", options: ["Introvert (Homebody)", "Ambivert", "Extrovert (Outgoing)"] },
  { id: "shared_language", label: "Communication", icon: "🗣️", options: ["Direct & open", "Thoughtful & measured", "Non-confrontational"] },
  { id: "handling_disagreement", label: "Conflict Resolution", icon: "🤝", options: ["Discuss immediately", "Need time to process", "Avoid if possible"] },
  { id: "family_living", label: "Household Chores", icon: "🧹", options: ["Split equally", "Traditional roles", "Flexible/Outsource"] },
  { id: "relocation", label: "Relocation", icon: "✈️", options: ["Willing to move anywhere", "Move within country", "Prefer to stay put"] },
  { id: "culture_traditions", label: "Pets", icon: "🐾", options: ["Must have pets", "Open to pets", "No pets please"] },
  
  { id: "diet", label: "Diet", icon: "🥗", options: ["Vegetarian", "Vegan", "Halal", "Kosher", "No restrictions"] }
];
type TierList = { ideal: string[]; accepted: string[]; stretch: string[] };
type TopicPreferencesState = Record<string, TierList>;

const list = z.string().optional();
const schema = z.object({
  name: z.string().trim().min(2).max(80),
  city: z.string().trim().max(80).optional(),
  occupation: z.string().trim().max(120).optional(),
  education: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(1000).optional(),
  futurePlans: z.string().trim().max(500).optional(),
  languages: list,
  minAge: z.coerce.number().min(18).max(99).optional(),
  maxAge: z.coerce.number().min(18).max(99).optional(),
  gender: z.string().optional(),
  cities: list,
  settlementCities: list,
});
type FormValues = z.infer<typeof schema>;
const toList = (s?: string) => (s ? s.split(",").map((x) => x.trim()).filter(Boolean) : []);

function MePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me, isLoading, error } = useQuery(meQuery());
  const { register, handleSubmit, reset, getValues, setValue, watch, formState } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
  });

  const [topicPrefs, setTopicPrefs] = useState<TopicPreferencesState>({});
  const updatePreference = (topicId: string, option: string, tier: 'ideal' | 'accepted' | 'stretch') => {
    setTopicPrefs((prev) => {
      const topicObj = prev[topicId] || {};
      const ideal = Array.isArray(topicObj.ideal) ? topicObj.ideal : [];
      const accepted = Array.isArray(topicObj.accepted) ? topicObj.accepted : [];
      const stretch = Array.isArray(topicObj.stretch) ? topicObj.stretch : [];

      const currentTierList = tier === 'ideal' ? ideal : tier === 'accepted' ? accepted : stretch;

      if (currentTierList.includes(option)) {
        return {
          ...prev,
          [topicId]: {
            ideal: ideal.filter((o) => o !== option),
            accepted: accepted.filter((o) => o !== option),
            stretch: stretch.filter((o) => o !== option),
          },
        };
      }

      return {
        ...prev,
        [topicId]: {
          ideal: tier === 'ideal' ? [...ideal.filter((o) => o !== option), option] : ideal.filter((o) => o !== option),
          accepted: tier === 'accepted' ? [...accepted.filter((o) => o !== option), option] : accepted.filter((o) => o !== option),
          stretch: tier === 'stretch' ? [...stretch.filter((o) => o !== option), option] : stretch.filter((o) => o !== option),
        },
      };
    });
  };

  useEffect(() => {
    if (me) {
      reset({
        name: me.name,
        city: me.city ?? "",
        occupation: me.occupation ?? "",
        education: me.education ?? "",
        bio: me.bio ?? "",
        futurePlans: me.futurePlans ?? "",
        languages: (me.languages ?? []).join(", "),
        minAge: me.preferences?.minAge,
        maxAge: me.preferences?.maxAge,
        gender: me.preferences?.gender ?? "all",
        cities: (me.preferences?.cities ?? []).join(", "),
        settlementCities: (me.preferences?.settlementCities ?? []).join(", "),
      });
      setTopicPrefs(me.preferences?.topicPreferences ?? {});
    }
  }, [me, reset]);

  const save = useMutation({
    mutationFn: (v: FormValues) =>
      profileApi.updateMe({
        name: v.name,
        city: v.city,
        occupation: v.occupation,
        education: v.education,
        bio: v.bio,
        futurePlans: v.futurePlans,
        languages: toList(v.languages),
        preferences: { 
          ...me?.preferences, 
          minAge: v.minAge, 
          maxAge: v.maxAge,
          gender: v.gender,
          cities: toList(v.cities),
          settlementCities: toList(v.settlementCities),
          topicPreferences: topicPrefs
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.me }),
  });
  const draft = useMutation({
    mutationFn: () => aiApi.assist({ kind: "bio", text: getValues("bio") || getValues("occupation") || "" }),
    onSuccess: (r) => r.choices?.[0] && setValue("bio", r.choices[0].text),
  });

  if (isLoading) {
    return (
      <div className="stack-6" style={{ padding: "1.5rem 0", maxWidth: "1050px", margin: "0 auto" }}>
        {/* Header Skeleton exactly matching PageHeader */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div className="stack-2">
            <div className="skeleton-shimmer" style={{ width: "220px", height: "3rem", borderRadius: "8px", marginBottom: "0.25rem" }} />
            <div className="skeleton-shimmer" style={{ width: "320px", height: "1.2rem", borderRadius: "4px" }} />
          </div>
          <div className="row-2 wrap">
            <div className="skeleton-shimmer" style={{ width: "110px", height: "2.25rem", borderRadius: "999px" }} />
            <div className="skeleton-shimmer" style={{ width: "90px", height: "2.25rem", borderRadius: "999px" }} />
            <div className="skeleton-shimmer" style={{ width: "100px", height: "2.25rem", borderRadius: "999px" }} />
            <div className="skeleton-shimmer" style={{ width: "150px", height: "2.25rem", borderRadius: "999px" }} />
          </div>
        </div>
        
        {/* Gallery (Photos) Skeleton exactly matching the Gallery card */}
        <Card variant="surface">
          <div className="stack-4">
            <div className="row-2 between">
              <div className="skeleton-shimmer" style={{ width: "90px", height: "1.75rem", borderRadius: "6px" }} />
              <div className="skeleton-shimmer" style={{ width: "110px", height: "2.25rem", borderRadius: "999px" }} />
            </div>
            <div className="skeleton-shimmer" style={{ width: "380px", height: "1rem", borderRadius: "4px" }} />
            <div className="grid-cards">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton-shimmer" style={{ aspectRatio: "3/4", borderRadius: "12px", opacity: 1 - i * 0.15 }} />
              ))}
            </div>
          </div>
        </Card>

        {/* Form (Details) Skeleton exactly matching the Details card */}
        <Card>
          <div className="stack-4" style={{ padding: "2rem" }}>
            <div className="skeleton-shimmer" style={{ width: "100px", height: "1.75rem", borderRadius: "6px" }} />
            <div className="grid-2">
              <div className="stack-2">
                <div className="skeleton-shimmer" style={{ width: "50px", height: "1rem", borderRadius: "4px" }} />
                <div className="skeleton-shimmer" style={{ width: "100%", height: "2.75rem", borderRadius: "8px" }} />
              </div>
              <div className="stack-2">
                <div className="skeleton-shimmer" style={{ width: "40px", height: "1rem", borderRadius: "4px" }} />
                <div className="skeleton-shimmer" style={{ width: "100%", height: "2.75rem", borderRadius: "8px" }} />
              </div>
              <div className="stack-2">
                <div className="skeleton-shimmer" style={{ width: "90px", height: "1rem", borderRadius: "4px" }} />
                <div className="skeleton-shimmer" style={{ width: "100%", height: "2.75rem", borderRadius: "8px" }} />
              </div>
              <div className="stack-2">
                <div className="skeleton-shimmer" style={{ width: "80px", height: "1rem", borderRadius: "4px" }} />
                <div className="skeleton-shimmer" style={{ width: "100%", height: "2.75rem", borderRadius: "8px" }} />
              </div>
            </div>
            <div className="stack-2" style={{ marginTop: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div className="skeleton-shimmer" style={{ width: "80px", height: "1.25rem", borderRadius: "4px" }} />
                <div className="skeleton-shimmer" style={{ width: "100px", height: "1.5rem", borderRadius: "4px" }} />
              </div>
              <div className="skeleton-shimmer" style={{ width: "100%", height: "7rem", borderRadius: "8px" }} />
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  if (error) return <ErrorState error={error} />;

  return (
    <>
      <PageHeader
        title="My profile"
        subtitle="A warm, honest profile gets better matches."
        actions={
          <div className="row-2 wrap">
            <Button size="sm" variant="outline" onClick={() => navigate({ to: "/story" })}>
              <SparklesIcon size={16} style={{ marginRight: "0.375rem" }} />
              My Story
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate({ to: "/billing" })}>
              <CrownIcon size={16} style={{ marginRight: "0.375rem" }} />
              Plans
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate({ to: "/settings" })}>
              <GearIcon size={16} style={{ marginRight: "0.375rem" }} />
              Settings
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate({ to: "/account-centre" })}>
              <ShieldCheckIcon size={16} style={{ marginRight: "0.375rem" }} />
              Account Centre
            </Button>
          </div>
        }
      />
      <Gallery />
      <Card>
        <form className="stack-4" onSubmit={handleSubmit((v) => save.mutate(v))} noValidate>
          <Heading level="h3">Details</Heading>
          <div className="grid-2">
            <Field id="name" label="Name" {...register("name")} error={formState.errors.name?.message} />
            <Field id="city" label="City" {...register("city")} />
            <SearchableDropdown
              id="education"
              label="Education"
              value={watch("education") || ""}
              onChange={(val: string) => setValue("education", val, { shouldDirty: true })}
              options={EDUCATION_OPTIONS}
              placeholder="Select degree or type custom education..."
              endpoint="/v1/education"
            />
            <SearchableDropdown
              id="occupation"
              label="Occupation"
              value={watch("occupation") || ""}
              onChange={(val: string) => setValue("occupation", val, { shouldDirty: true })}
              options={OCCUPATION_OPTIONS}
              placeholder="Select role or type custom occupation..."
              endpoint="/v1/occupations"
            />
            <Field id="languages" label="Languages (comma separated)" {...register("languages")} />
          </div>
          <div className="ds-field">
            <div className="row-2 between">
              <Label htmlFor="bio">About me</Label>
              <Button size="sm" variant="ghost" loading={draft.isPending} onClick={() => draft.mutate()}>
                Help me write
              </Button>
            </div>
            <Textarea id="bio" rows={4} {...register("bio")} />
          </div>
          <Heading level="h3">Looking for</Heading>
          <div className="grid-2">
            <div className="ds-field">
              <Label htmlFor="gender">Gender</Label>
              <select id="gender" style={{ width: "100%", padding: "0.625rem", borderRadius: "8px", border: "1px solid var(--border, #e5e7eb)", background: "transparent", color: "inherit", fontFamily: "inherit" }} {...register("gender")}>
                <option value="all">Any</option>
                <option value="woman">Woman</option>
                <option value="man">Man</option>
                <option value="non-binary">Non-binary</option>
              </select>
            </div>
            <Field id="minAge" label="Minimum age" type="number" {...register("minAge")} error={formState.errors.minAge?.message} />
            <Field id="maxAge" label="Maximum age" type="number" {...register("maxAge")} error={formState.errors.maxAge?.message} />
            <Field id="cities" label="Preferred Cities (comma separated)" {...register("cities")} />
            <Field id="settlementCities" label="Settlement Cities (comma separated)" {...register("settlementCities")} />
          </div>
          {/* Redesigned Premium Partner Preferences Grid */}
          <div style={{ marginTop: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <div>
                <Heading level="h3" style={{ margin: 0 }}>Partner Preferences</Heading>
                <Text variant="caption" style={{ color: "var(--muted-foreground)" }}>
                  Select your preference tier for each lifestyle & values option.
                </Text>
              </div>
              
              {/* Legend Bar */}
              <div style={{ display: "flex", gap: "0.75rem", background: "var(--surface-sunken, rgba(0,0,0,0.03))", padding: "0.35rem 0.85rem", borderRadius: "999px", fontSize: "0.75rem", border: "1px solid var(--border)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 600, color: "var(--rose-active)" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--rose-active)" }} /> Ideal
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 600, color: "#10b981" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981" }} /> Accepted
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 600, color: "#f59e0b" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#f59e0b" }} /> Stretch
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
              {TOPICS.map((topic) => (
                <div 
                  key={topic.id} 
                  style={{
                    background: "var(--surface-sunken, rgba(0,0,0,0.015))",
                    border: "1px solid var(--border)",
                    borderRadius: "14px",
                    padding: "1.1rem 1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.85rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.01)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>{topic.icon || "✨"}</span>
                    <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--ink)" }}>{topic.label}</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {topic.options.map((opt) => {
                      const isIdeal = Boolean(topicPrefs[topic.id]?.ideal?.includes(opt));
                      const isAccepted = Boolean(topicPrefs[topic.id]?.accepted?.includes(opt));
                      const isStretch = Boolean(topicPrefs[topic.id]?.stretch?.includes(opt));

                      return (
                        <div 
                          key={opt} 
                          style={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center", 
                            gap: "0.75rem",
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "10px",
                            padding: "0.45rem 0.75rem",
                          }}
                        >
                          <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--ink)", flex: 1 }}>{opt}</span>
                          
                          <div style={{ display: "inline-flex", gap: "0.15rem", background: "rgba(0,0,0,0.04)", padding: "0.15rem", borderRadius: "999px", border: "1px solid var(--border)", flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => updatePreference(topic.id, opt, "ideal")}
                              style={{
                                border: "none",
                                borderRadius: "999px",
                                padding: "0.2rem 0.55rem",
                                fontSize: "0.725rem",
                                fontWeight: isIdeal ? 700 : 500,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                background: isIdeal ? "var(--rose-active)" : "transparent",
                                color: isIdeal ? "#ffffff" : "var(--muted-foreground)",
                                boxShadow: isIdeal ? "0 2px 6px rgba(186,107,120,0.4)" : "none",
                              }}
                            >
                              Ideal
                            </button>
                            <button
                              type="button"
                              onClick={() => updatePreference(topic.id, opt, "accepted")}
                              style={{
                                border: "none",
                                borderRadius: "999px",
                                padding: "0.2rem 0.55rem",
                                fontSize: "0.725rem",
                                fontWeight: isAccepted ? 700 : 500,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                background: isAccepted ? "#10b981" : "transparent",
                                color: isAccepted ? "#ffffff" : "var(--muted-foreground)",
                                boxShadow: isAccepted ? "0 2px 6px rgba(16,185,129,0.3)" : "none",
                              }}
                            >
                              Accepted
                            </button>
                            <button
                              type="button"
                              onClick={() => updatePreference(topic.id, opt, "stretch")}
                              style={{
                                border: "none",
                                borderRadius: "999px",
                                padding: "0.2rem 0.55rem",
                                fontSize: "0.725rem",
                                fontWeight: isStretch ? 700 : 500,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                background: isStretch ? "#f59e0b" : "transparent",
                                color: isStretch ? "#ffffff" : "var(--muted-foreground)",
                                boxShadow: isStretch ? "0 2px 6px rgba(245,158,11,0.3)" : "none",
                              }}
                            >
                              Stretch
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {(save.error || draft.error) && <p className="ds-field__hint ds-field__hint--error" role="alert">{(save.error ?? draft.error)?.message}</p>}
          {save.isSuccess && <Text variant="strong">Saved.</Text>}
          <div>
            <Button type="submit" loading={save.isPending}>
              Save profile
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}

function Gallery() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data } = useQuery(galleryQuery());
  const { data: me } = useQuery(meQuery());
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.gallery });
  const upload = useMutation({ mutationFn: mediaApi.upload, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: mediaApi.remove, onSuccess: invalidate });
  const setMain = useMutation({ mutationFn: mediaApi.setMain, onSuccess: invalidate });

  function onFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => upload.mutate(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(file);
  }

  const photos = data?.photos ?? [];
  const full = photos.length >= (data?.maxSlots ?? 6);
  const err = upload.error ?? remove.error ?? setMain.error;

  return (
    <Card variant="surface">
      <div className="stack-4">
        <div className="row-2 between">
          <Heading level="h3">Photos</Heading>
          <Button size="sm" variant="outline" disabled={full} loading={upload.isPending} onClick={() => fileRef.current?.click()}>
            Add photo
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        <Text variant="small">Up to six photos. Each is reviewed privately before it's shown.</Text>
        {err && <p className="ds-field__hint ds-field__hint--error" role="alert">{err.message}</p>}
        <div className="grid-cards">
          {photos.map((p) => (
            <div key={p.id} className="stack-2">
              <div 
                style={{ 
                  position: "relative", 
                  width: "150px", 
                  height: "200px", 
                  borderRadius: "12px", 
                  overflow: "hidden", 
                  marginBottom: "0.5rem", 
                  border: "1px solid var(--border)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                }}
              >
                <img 
                  src={photoUrl(p.url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(me?.name || "Member")}&background=f1f5f9&color=94a3b8&size=512`} 
                  alt={`Profile photo ${p.slot}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", backgroundColor: "transparent" }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(me?.name || "Member")}&background=f1f5f9&color=94a3b8&size=512`;
                  }}
                />
                
                {/* Badges Overlay (Top Left) */}
                <div style={{ position: "absolute", top: "8px", left: "8px", display: "flex", gap: "4px", flexWrap: "wrap", maxWidth: "134px" }}>
                  {p.isMain ? <span style={{ background: "var(--ink)", color: "var(--surface)", fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>MAIN</span> : null}
                  <span style={{ background: "rgba(255,255,255,0.95)", color: p.isApproved ? "var(--rose-active)" : "var(--muted-foreground)", fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", fontWeight: 600, border: "1px solid var(--border)" }}>
                    {p.moderationStatus.toUpperCase()}
                  </span>
                </div>
                
                {/* Action Buttons Overlay (Bottom Right) */}
                <div style={{ position: "absolute", bottom: "8px", right: "8px", display: "flex", gap: "6px" }}>
                  {!p.isMain && (
                    <button 
                      title="Make Main Profile Photo"
                      type="button"
                      onClick={() => setMain.mutate(p.id)}
                      style={{ background: "rgba(255,255,255,0.95)", border: "1px solid var(--border)", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--ink)", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", fontSize: "0.8rem" }}
                    >
                      ⭐
                    </button>
                  )}
                  <button 
                    title="Remove Photo"
                    type="button"
                    onClick={() => remove.mutate(p.id)}
                    style={{ background: "rgba(255,255,255,0.95)", border: "1px solid var(--border)", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--rose)", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", fontSize: "0.8rem" }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
