import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef } from "react";
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

  useEffect(() => {
    if (me)
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
      });
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
        preferences: { ...me?.preferences, minAge: v.minAge, maxAge: v.maxAge },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.me }),
  });
  const draft = useMutation({
    mutationFn: () => aiApi.assist({ kind: "bio", text: getValues("bio") || getValues("occupation") || "" }),
    onSuccess: (r) => r.choices?.[0] && setValue("bio", r.choices[0].text),
  });

  if (isLoading) return <LoadingState />;
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
          <Heading level="h3">Looking for</Heading>
          <div className="grid-2">
            <Field id="minAge" label="Minimum age" type="number" {...register("minAge")} error={formState.errors.minAge?.message} />
            <Field id="maxAge" label="Maximum age" type="number" {...register("maxAge")} error={formState.errors.maxAge?.message} />
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
