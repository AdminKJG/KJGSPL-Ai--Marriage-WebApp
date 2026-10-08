import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, Heading, Label, Text, Textarea } from "@/components/ui";
import { ErrorState, Field, LoadingState, PageHeader } from "@/components/ui";
import { CrownIcon, GearIcon, ShieldCheckIcon, SparklesIcon } from "@/components/icons/NavIcons";
import { aiApi, galleryQuery, mediaApi, meQuery, profileApi, qk } from "@/lib/api/modules";
import { photoUrl } from "@/lib/api/client";

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
  { id: "marriage_timing", label: "Marriage Timing", options: ["Within 1 year", "1-2 years", "2-3 years", "Not sure yet"] },
  { id: "children", label: "Children", options: ["Want someday", "Do not want", "Have & want more", "Have & do not want more"] },
  { id: "diet", label: "Diet", options: ["Vegetarian", "Vegan", "Halal", "Kosher", "No restrictions"] },
  { id: "smoking", label: "Smoking", options: ["Never", "Occasionally", "Regularly"] },
  { id: "career_partnership", label: "Career Ambition", options: ["Very ambitious", "Balanced", "Work to live"] },
  { id: "money_management", label: "Finances", options: ["Saver", "Balanced", "Spender"] },
  { id: "social_rhythm", label: "Social Life", options: ["Introvert (Homebody)", "Ambivert", "Extrovert (Outgoing)"] },
  { id: "shared_language", label: "Communication", options: ["Direct & open", "Thoughtful & measured", "Non-confrontational"] },
  { id: "handling_disagreement", label: "Conflict Resolution", options: ["Discuss immediately", "Need time to process", "Avoid if possible"] },
  { id: "family_living", label: "Household Chores", options: ["Split equally", "Traditional roles", "Flexible/Outsource"] },
  { id: "relocation", label: "Relocation", options: ["Willing to move anywhere", "Move within country", "Prefer to stay put"] },
  { id: "culture_traditions", label: "Pets", options: ["Must have pets", "Open to pets", "No pets please"] },
  { id: "shared_activities", label: "Travel", options: ["Frequent traveler", "Occasional vacations", "Prefer staying home"] }
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
  const { register, handleSubmit, reset, getValues, setValue, formState } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
  });

  const [topicPrefs, setTopicPrefs] = useState<TopicPreferencesState>({});
  const updatePreference = (topicId: string, option: string, tier: 'ideal' | 'accepted' | 'stretch') => {
    setTopicPrefs((prev) => {
      const current = prev[topicId] || { ideal: [], accepted: [], stretch: [] };
      if (current[tier].includes(option)) {
         return { ...prev, [topicId]: { ...current, [tier]: current[tier].filter((opt: string) => opt !== option) } };
      }
      return {
        ...prev,
        [topicId]: {
          ideal: tier === 'ideal' ? [...current.ideal.filter((o: string) => o !== option), option] : current.ideal.filter((o: string) => o !== option),
          accepted: tier === 'accepted' ? [...current.accepted.filter((o: string) => o !== option), option] : current.accepted.filter((o: string) => o !== option),
          stretch: tier === 'stretch' ? [...current.stretch.filter((o: string) => o !== option), option] : current.stretch.filter((o: string) => o !== option),
        }
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
      <div className="stack-6" style={{ padding: "1.5rem", maxWidth: "900px", margin: "0 auto" }}>
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
            <Field id="occupation" label="Occupation" {...register("occupation")} />
            <Field id="education" label="Education" {...register("education")} />
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
          <div className="ds-field">
            <Label htmlFor="futurePlans">Future plans</Label>
            <Textarea id="futurePlans" rows={3} {...register("futurePlans")} />
          </div>
          <Heading level="h3">Looking for (Partner Preferences)</Heading>
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
          <Heading level="h3" style={{ marginTop: "2rem" }}>16-Topic Compatibility</Heading>
          <div className="stack-4">
            {TOPICS.map((topic) => (
              <div key={topic.id} className="ds-field stack-2" style={{ padding: "1rem", background: "var(--surface-sunken, rgba(0,0,0,0.02))", borderRadius: "8px" }}>
                <Label>{topic.label}</Label>
                <div className="stack-3">
                  {topic.options.map((opt) => (
                    <div key={opt} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                      <span style={{ flex: 1, fontSize: "0.875rem" }}>{opt}</span>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Button type="button" size="sm" variant={topicPrefs[topic.id]?.ideal.includes(opt) ? "primary" : "outline"} onClick={() => updatePreference(topic.id, opt, "ideal")} style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", height: "auto" }}>Ideal</Button>
                        <Button type="button" size="sm" variant={topicPrefs[topic.id]?.accepted.includes(opt) ? "primary" : "outline"} onClick={() => updatePreference(topic.id, opt, "accepted")} style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", height: "auto" }}>Accepted</Button>
                        <Button type="button" size="sm" variant={topicPrefs[topic.id]?.stretch.includes(opt) ? "primary" : "outline"} onClick={() => updatePreference(topic.id, opt, "stretch")} style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", height: "auto" }}>Stretch</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
              <div className="photo">
                <img src={photoUrl(p.url) ?? ""} alt={`Profile photo ${p.slot}`} />
              </div>
              <div className="row-2 wrap">
                {p.isMain ? <Badge variant="ink">Main</Badge> : null}
                <Badge variant={p.isApproved ? "rose" : "outline"}>{p.moderationStatus.toLowerCase()}</Badge>
              </div>
              <div className="row-2 wrap">
                {!p.isMain && (
                  <Button size="sm" variant="ghost" onClick={() => setMain.mutate(p.id)}>
                    Make main
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => remove.mutate(p.id)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
