import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge, Button, Card, Heading, Label, Text, Textarea } from "@/components/ui";
import { Avatar, ErrorState, LoadingState, TagList } from "@/components/ui";
import { callsApi, compatibilityQuery, connectionsQuery, profileApi, profileQuery, qk } from "@/lib/api/modules";
import { getSocket } from "@/lib/socket";
import { callAccepted, useAppDispatch } from "@/store";

export const Route = createFileRoute("/_member/profile/$id")({
  head: () => ({
    meta: [
      { title: "Member profile — AI Marriage" },
      { name: "description", content: "View a member's story, values and compatibility." },
      { property: "og:title", content: "Member profile — AI Marriage" },
      { property: "og:description", content: "View a member's story, values and compatibility." },
    ],
  }),
  component: ProfilePage,
});

const ProfileStyles = () => (
  <style>{`
    .profile-page-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      width: 100%;
    }
    .profile-grid-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
      align-items: start;
    }
    .profile-header-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .profile-header-top {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex: 1;
      min-width: 280px;
    }
    .profile-avatar-wrapper {
      flex-shrink: 0;
    }
    .profile-header-info {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      min-width: 0;
    }
    .profile-name {
      font-family: var(--font-serif);
      font-size: 2rem;
      font-weight: 500;
      margin: 0;
      color: var(--ink);
      line-height: 1.2;
    }
    .profile-meta {
      margin: 0;
      font-size: 0.9rem;
      color: var(--muted-foreground);
      line-height: 1.4;
      word-break: break-word;
    }
    .profile-intention-badge {
      display: inline-flex;
      align-items: center;
      align-self: flex-start;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      background-color: rgba(186, 107, 120, 0.15);
      color: var(--rose-active);
      font-size: 0.825rem;
      font-weight: 500;
      line-height: 1.3;
      max-width: 100%;
      white-space: normal;
      margin-top: 0.2rem;
    }
    .profile-header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .topic-metric-card {
      padding: 0.75rem 0.85rem;
      border-radius: 12px;
      background: var(--background);
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      transition: all 0.2s ease;
    }
    .topic-metric-card:hover {
      border-color: rgba(186, 107, 120, 0.3);
    }
    @media (max-width: 768px) {
      .profile-grid-container {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 640px) {
      .profile-header-card {
        flex-direction: column;
        align-items: flex-start;
        padding: 1.25rem;
      }
      .profile-header-top {
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
        min-width: 0;
      }
      .profile-header-actions {
        width: 100%;
      }
      .profile-header-actions button,
      .profile-header-actions .skeleton-button {
        flex: 1;
      }
    }
  `}</style>
);

const ProfileSkeleton = () => (
  <div className="profile-page-wrapper">
    <ProfileStyles />
    {/* Header Card Skeleton */}
    <div className="profile-header-card">
      <div className="profile-header-top">
        <div className="profile-avatar-wrapper">
          <div className="skeleton-shimmer" style={{ width: "96px", height: "96px", borderRadius: "50%" }} />
        </div>
        <div className="profile-header-info" style={{ flex: 1 }}>
          <div className="skeleton-shimmer" style={{ width: "220px", height: "2.25rem", borderRadius: "8px", marginBottom: "0.25rem" }} />
          <div className="skeleton-shimmer" style={{ width: "280px", height: "1.1rem", borderRadius: "4px", marginBottom: "0.35rem" }} />
          <div className="skeleton-shimmer" style={{ width: "150px", height: "1.6rem", borderRadius: "999px" }} />
        </div>
      </div>
      <div className="profile-header-actions">
        <div className="skeleton-shimmer skeleton-button" style={{ width: "130px", height: "2.5rem", borderRadius: "8px" }} />
      </div>
    </div>

    {/* 2 Column Bento Grid Skeleton */}
    <div className="profile-grid-container">
      {/* Left Column: About & Personal Prompts */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* About Card Skeleton */}
        <Card variant="surface">
          <div className="stack-4">
            <div className="skeleton-shimmer" style={{ width: "90px", height: "1.75rem", borderRadius: "6px" }} />
            <div className="stack-2">
              <div className="skeleton-shimmer" style={{ width: "95%", height: "1rem", borderRadius: "4px" }} />
              <div className="skeleton-shimmer" style={{ width: "85%", height: "1rem", borderRadius: "4px" }} />
              <div className="skeleton-shimmer" style={{ width: "65%", height: "1rem", borderRadius: "4px" }} />
            </div>
            {/* Interests & Values Tag Pills */}
            <div className="stack-3">
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <div className="skeleton-shimmer" style={{ width: "75px", height: "1.75rem", borderRadius: "999px" }} />
                <div className="skeleton-shimmer" style={{ width: "95px", height: "1.75rem", borderRadius: "999px" }} />
                <div className="skeleton-shimmer" style={{ width: "80px", height: "1.75rem", borderRadius: "999px" }} />
                <div className="skeleton-shimmer" style={{ width: "110px", height: "1.75rem", borderRadius: "999px" }} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <div className="skeleton-shimmer" style={{ width: "85px", height: "1.75rem", borderRadius: "999px" }} />
                <div className="skeleton-shimmer" style={{ width: "120px", height: "1.75rem", borderRadius: "999px" }} />
                <div className="skeleton-shimmer" style={{ width: "70px", height: "1.75rem", borderRadius: "999px" }} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <div className="skeleton-shimmer" style={{ width: "65px", height: "1.75rem", borderRadius: "999px" }} />
                <div className="skeleton-shimmer" style={{ width: "90px", height: "1.75rem", borderRadius: "999px" }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Personal Prompts Skeleton */}
        <Card variant="surface">
          <div className="stack-4">
            <div className="skeleton-shimmer" style={{ width: "160px", height: "1.75rem", borderRadius: "6px" }} />
            <div className="stack-3">
              <div className="stack-1">
                <div className="skeleton-shimmer" style={{ width: "70%", height: "1.1rem", borderRadius: "4px" }} />
                <div className="skeleton-shimmer" style={{ width: "90%", height: "1rem", borderRadius: "4px" }} />
              </div>
              <div className="stack-1">
                <div className="skeleton-shimmer" style={{ width: "60%", height: "1.1rem", borderRadius: "4px" }} />
                <div className="skeleton-shimmer" style={{ width: "85%", height: "1rem", borderRadius: "4px" }} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Right Column: Compatibility Matrix Skeleton */}
      <Card variant="surface">
        <div className="stack-4">
          <div className="row-2 between wrap">
            <div className="skeleton-shimmer" style={{ width: "180px", height: "1.75rem", borderRadius: "6px" }} />
            <div className="skeleton-shimmer" style={{ width: "90px", height: "1.6rem", borderRadius: "999px" }} />
          </div>

          {/* Compatibility Score Circle/Number */}
          <div className="row-3 wrap align-center" style={{ padding: "0.5rem 0" }}>
            <div className="skeleton-shimmer" style={{ width: "80px", height: "3rem", borderRadius: "8px" }} />
            <div className="stack-1 flex-1">
              <div className="skeleton-shimmer" style={{ width: "170px", height: "1.1rem", borderRadius: "4px" }} />
              <div className="skeleton-shimmer" style={{ width: "130px", height: "0.9rem", borderRadius: "4px" }} />
            </div>
          </div>

          {/* 16-Topic Breakdown Cards Skeleton */}
          <div className="stack-3" style={{ marginTop: "0.25rem" }}>
            <div className="skeleton-shimmer" style={{ width: "220px", height: "1rem", borderRadius: "4px" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="topic-metric-card">
                  <div className="row-2 between" style={{ gap: "0.5rem" }}>
                    <div className="skeleton-shimmer" style={{ width: "60%", height: "0.9rem", borderRadius: "4px" }} />
                    <div className="skeleton-shimmer" style={{ width: "35px", height: "1.1rem", borderRadius: "999px" }} />
                  </div>
                  <div className="skeleton-shimmer" style={{ width: "100%", height: "5px", borderRadius: "999px" }} />
                </div>
              ))}
            </div>
          </div>

          {/* Strengths Tags Skeleton */}
          <div className="stack-2">
            <div className="skeleton-shimmer" style={{ width: "180px", height: "1.1rem", borderRadius: "4px" }} />
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <div className="skeleton-shimmer" style={{ width: "100px", height: "1.75rem", borderRadius: "999px" }} />
              <div className="skeleton-shimmer" style={{ width: "130px", height: "1.75rem", borderRadius: "999px" }} />
              <div className="skeleton-shimmer" style={{ width: "90px", height: "1.75rem", borderRadius: "999px" }} />
            </div>
          </div>

          {/* Divergence Tags Skeleton */}
          <div className="stack-2">
            <div className="skeleton-shimmer" style={{ width: "150px", height: "1.1rem", borderRadius: "4px" }} />
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <div className="skeleton-shimmer" style={{ width: "110px", height: "1.75rem", borderRadius: "999px" }} />
              <div className="skeleton-shimmer" style={{ width: "95px", height: "1.75rem", borderRadius: "999px" }} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
);

function ProfilePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  
  const { data: p, isLoading, error } = useQuery(profileQuery(id));
  const compat = useQuery(compatibilityQuery(id));
  const connections = useQuery(connectionsQuery());

  const [isCalling, setIsCalling] = useState(false);
  const [interestSentLocally, setInterestSentLocally] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");

  const startCall = async () => {
    setIsCalling(true);
    try {
      const res = await callsApi.initiate(id, "AUDIO");
      getSocket()?.emit("call:ring", { targetUserId: id, ...res.call });
      dispatch(callAccepted({ call: res.call, url: res.call.url, roomName: res.call.roomName, token: res.call.token }));
    } catch (err: any) {
      if (err?.status === 409) {
        alert(err.message || "One of you is already on a call.");
        return;
      }
      getSocket()?.emit("call:ring", { targetUserId: id, kind: "AUDIO" });
      dispatch(callAccepted({ call: { callId: `call_${Date.now()}`, callerId: "me", calleeId: id, kind: "AUDIO", status: "ACCEPTED" } }));
    } finally {
      setIsCalling(false);
    }
  };

  const refresh = () => {
    qc.invalidateQueries({ queryKey: qk.profile(id) });
    qc.invalidateQueries({ queryKey: qk.connections });
  };

  const interest = useMutation({
    mutationFn: () => profileApi.interest(id),
    onSuccess: (r) => {
      setInterestSentLocally(true);
      const isMut = r.status === "matched" || ("mutual" in r && Boolean(r.mutual));
      setStatus(isMut ? "It's mutual — you can now chat." : "Interest sent successfully!");
      refresh();
    },
  });

  const block = useMutation({
    mutationFn: () => profileApi.block(id),
    onSuccess: () => navigate({ to: "/discover" }),
  });

  const report = useMutation({
    mutationFn: () => profileApi.report(id, { reason: "other", details: reason }),
    onSuccess: () => {
      setReporting(false);
      setStatus("Thanks — our safety team will review this.");
    },
  });

  if (isLoading) return <ProfileSkeleton />;
  if (error || !p) return <ErrorState error={error} />;

  // Connection State logic
  const connData = connections.data;
  const isMutual =
    p.connectionState === "mutual" ||
    p.connectionState === "matched" ||
    (connData?.mutual && connData.mutual.some((item: any) => (typeof item === "string" ? item === id : item.id === id)));

  const isSent =
    interestSentLocally ||
    interest.isSuccess ||
    p.connectionState === "sent" ||
    (connData?.sent && connData.sent.some((item: any) => (typeof item === "string" ? item === id : item.id === id)));

  const isReceived =
    p.connectionState === "received" ||
    (connData?.received && connData.received.some((item: any) => (typeof item === "string" ? item === id : item.id === id)));

  const score = compat.data?.score ?? compat.data?.compatibility ?? compat.data?.overall;
  const meta = [p.age ? `${p.age} yrs` : null, p.city, p.occupation, p.education].filter(Boolean).join(" · ");

  return (
    <div className="profile-page-wrapper">
      <ProfileStyles />

      {/* Header Card */}
      <div className="profile-header-card">
        <div className="profile-header-top">
          <div className="profile-avatar-wrapper">
            <Avatar profile={p} large />
          </div>
          <div className="profile-header-info">
            <h1 className="profile-name">{p.name}</h1>
            {meta && <p className="profile-meta">{meta}</p>}
            {p.intention && (
              <span className="profile-intention-badge">
                {p.intention}
              </span>
            )}
          </div>
        </div>

        <div className="profile-header-actions">
          {isMutual ? (
            <>
              <Badge variant="rose" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                ✓ Mutual Match
              </Badge>
              <Button variant="outline" onClick={() => navigate({ to: "/messages/$profileId", params: { profileId: id } })}>
                💬 Message
              </Button>
              <Button variant="outline" onClick={startCall} loading={isCalling} disabled={isCalling}>
                📞 Call
              </Button>
            </>
          ) : isSent ? (
            <Button variant="outline" disabled style={{ opacity: 0.8, cursor: "default" }}>
              ✓ Interest Sent
            </Button>
          ) : isReceived ? (
            <Button loading={interest.isPending} onClick={() => interest.mutate()}>
              Accept Interest
            </Button>
          ) : (
            <Button loading={interest.isPending} onClick={() => interest.mutate()}>
              Send interest
            </Button>
          )}
        </div>
      </div>

      {status && <Text variant="strong" style={{ color: "var(--rose-active)" }}>{status}</Text>}
      {(interest.error || block.error || report.error) && (
        <p className="ds-field__hint ds-field__hint--error" role="alert">
          {(interest.error ?? block.error ?? report.error)?.message}
        </p>
      )}

      <div className="profile-grid-container">
        {/* Left Column: About & Personal Prompts */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Card variant="surface">
            <div className="stack-4">
              <Heading level="h3">About</Heading>
              {p.bio && <Text>{p.bio}</Text>}
              <TagList tags={p.interests} />
              <TagList tags={p.values} variant="rose" />
              <TagList tags={p.languages} variant="outline" />
              {p.cultural && (
                <TagList 
                  tags={Object.values(p.cultural).filter((v): v is string => typeof v === "string" && Boolean(v))} 
                  variant="outline" 
                />
              )}
            </div>
          </Card>

          {p.prompts && p.prompts.length > 0 && (
            <Card variant="surface">
              <div className="stack-4">
                <Heading level="h3">Personal Prompts</Heading>
                {p.prompts.map((q) => (
                  <div key={q.question} className="stack-1">
                    <Text variant="strong">{q.question}</Text>
                    <Text style={{ color: "var(--muted-foreground)" }}>{q.answer}</Text>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Compatibility Matrix */}
        <Card variant="surface">
          <div className="stack-4">
            <div className="row-2 between wrap">
              <Heading level="h3">Compatibility Matrix</Heading>
              {compat.data?.eligibility && (
                <Badge
                  variant={
                    compat.data.eligibility === "PASS"
                      ? "rose"
                      : compat.data.eligibility === "FAIL"
                      ? "outline"
                      : "default"
                  }
                >
                  Status: {compat.data.eligibility}
                </Badge>
              )}
            </div>

            {compat.isLoading && <LoadingState />}
            {compat.error && <Text variant="small">Compatibility appears once questionnaire chapters are completed.</Text>}

            {score != null && (
              <div className="row-3 wrap align-center" style={{ padding: "0.5rem 0" }}>
                <Heading level="h2" style={{ fontSize: "2.25rem", color: "var(--rose-active)", margin: 0 }}>
                  {Math.round(Number(score))}%
                </Heading>
                <div className="stack-1">
                  <Text variant="strong">Deterministic Alignment</Text>
                  {compat.data?.coverage != null && (
                    <Text variant="caption">Coverage: {compat.data.coverage}% evidence reviewed</Text>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Topic Breakdown Cards */}
            {compat.data?.categories && compat.data.categories.length > 0 && (
              <div className="stack-3" style={{ marginTop: "0.25rem" }}>
                <Text variant="caption" style={{ fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                  16-Topic Dimension Breakdown:
                </Text>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                  {compat.data.categories.map((cat) => (
                    <div key={cat.id} className="topic-metric-card">
                      <div className="row-2 between" style={{ gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {cat.label}
                        </span>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "999px", background: "rgba(186, 107, 120, 0.15)", color: "var(--rose-active)", flexShrink: 0 }}>
                          {cat.score}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: "5px",
                          backgroundColor: "var(--border)",
                          borderRadius: "999px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.min(100, Math.max(0, cat.score))}%`,
                            background: "linear-gradient(90deg, var(--rose-active) 0%, #f43f5e 100%)",
                            borderRadius: "999px",
                            transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {compat.data?.explanation && <Text>{String(compat.data.explanation)}</Text>}

            {/* Alignment Strengths */}
            {Array.isArray(compat.data?.reasons) && compat.data.reasons.length > 0 && (
              <div className="stack-2">
                <Text variant="strong">Key Strengths & Synergies:</Text>
                <TagList tags={compat.data.reasons.map(String)} variant="rose" />
              </div>
            )}

            {/* Divergence Areas */}
            {Array.isArray(compat.data?.differences) && compat.data.differences.length > 0 && (
              <div className="stack-2">
                <Text variant="strong">Areas for Discussion:</Text>
                <TagList tags={compat.data.differences.map(String)} variant="outline" />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Subtle Muted Footer Actions for Report / Block (Only for Mutual matches) */}
      {isMutual && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1.25rem", marginTop: "0.5rem", paddingTop: "0.5rem" }}>
            <button 
              type="button" 
              onClick={() => setReporting((v) => !v)}
              style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "0.8rem", cursor: "pointer", textDecoration: "underline", opacity: 0.8 }}
            >
              Report Profile
            </button>
            <button 
              type="button" 
              disabled={block.isPending}
              onClick={() => block.mutate()}
              style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "0.8rem", cursor: "pointer", textDecoration: "underline", opacity: 0.8 }}
            >
              {block.isPending ? "Blocking..." : "Block Member"}
            </button>
          </div>

          {reporting && (
            <Card variant="surface">
              <div className="stack-4">
                <Label htmlFor="report">What happened?</Label>
                <Textarea id="report" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />
                <Button variant="rose" disabled={reason.trim().length < 5} loading={report.isPending} onClick={() => report.mutate()}>
                  Submit report
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}




