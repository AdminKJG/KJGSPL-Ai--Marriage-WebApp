import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge, Button, Card, Divider, Heading, Label, Text, Textarea } from "@/components/ui";
import { Avatar, ErrorState, LoadingState, TagList } from "@/components/ui";
import { callsApi, compatibilityQuery, profileApi, profileQuery, qk } from "@/lib/api/modules";
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

function ProfilePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  const { data: p, isLoading, error } = useQuery(profileQuery(id));
  const compat = useQuery(compatibilityQuery(id));

  const startCall = async () => {
    try {
      const res = await callsApi.initiate(id, "AUDIO");
      getSocket()?.emit("call:ring", { targetUserId: id, kind: "AUDIO" });
      dispatch(callAccepted({ call: res.call, url: res.call.url, roomName: res.call.roomName, token: res.call.token }));
    } catch {
      getSocket()?.emit("call:ring", { targetUserId: id, kind: "AUDIO" });
      dispatch(callAccepted({ call: { callId: `call_${Date.now()}`, callerId: "me", calleeId: id, kind: "AUDIO", status: "ACCEPTED" } }));
    }
  };
  const [status, setStatus] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");

  const refresh = () => {
    qc.invalidateQueries({ queryKey: qk.profile(id) });
    qc.invalidateQueries({ queryKey: qk.connections });
  };
  const interest = useMutation({
    mutationFn: () => profileApi.interest(id),
    onSuccess: (r) => {
      const isMutual = r.status === "matched" || ("mutual" in r && Boolean(r.mutual));
      setStatus(isMutual ? "It's mutual — you can now chat." : "Interest sent.");
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

  if (isLoading) return <LoadingState />;
  if (error || !p) return <ErrorState error={error} />;

  const score = compat.data?.score ?? compat.data?.compatibility ?? compat.data?.overall;
  const meta = [p.age, p.city, p.occupation, p.education].filter(Boolean).join(" · ");

  return (
    <div className="stack-6">
      <Card>
        <div className="row-3 wrap">
          <Avatar profile={p} large />
          <div className="stack-2 grow">
            <Heading level="h1">{p.name}</Heading>
            {meta && <Text>{meta}</Text>}
            {p.intention && <Badge variant="rose">{p.intention}</Badge>}
          </div>
          <div className="row-2 wrap">
            <Button loading={interest.isPending} onClick={() => interest.mutate()}>
              Send interest
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: "/messages/$profileId", params: { profileId: id } })}>
              Message
            </Button>
            <Button variant="outline" onClick={startCall}>
              📞 Call
            </Button>
          </div>
        </div>
      </Card>
      {status && <Text variant="strong">{status}</Text>}
      {(interest.error || block.error || report.error) && (
        <p className="ds-field__hint ds-field__hint--error" role="alert">
          {(interest.error ?? block.error ?? report.error)?.message}
        </p>
      )}

      <div className="grid-2">
        <Card variant="surface">
          <div className="stack-4">
            <Heading level="h3">About</Heading>
            {p.bio && <Text>{p.bio}</Text>}
            {p.futurePlans && <Text variant="small">Future: {p.futurePlans}</Text>}
            <TagList tags={p.interests} />
            <TagList tags={p.values} variant="rose" />
            <TagList tags={p.languages} variant="outline" />
          </div>
        </Card>
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
              <div className="row-3 wrap align-center">
                <Heading level="h2">{Math.round(Number(score))}%</Heading>
                <div className="stack-1">
                  <Text variant="strong">Deterministic Alignment</Text>
                  {compat.data?.coverage != null && (
                    <Text variant="caption">Coverage: {compat.data.coverage}% evidence reviewed</Text>
                  )}
                </div>
              </div>
            )}

            {/* 5 Standardized Category Breakdown */}
            {compat.data?.categories && compat.data.categories.length > 0 && (
              <div className="stack-3" style={{ marginTop: "0.5rem" }}>
                <Text variant="caption">Dimension Breakdown (Weighted Algorithm):</Text>
                {compat.data.categories.map((cat) => (
                  <div key={cat.id} className="stack-1">
                    <div className="row-2 between">
                      <Text variant="small">
                        {cat.label} <span style={{ opacity: 0.6 }}>({cat.weight}%)</span>
                      </Text>
                      <Text variant="small" variant-style="strong">{cat.score}%</Text>
                    </div>
                    <div
                      style={{
                        height: "6px",
                        backgroundColor: "var(--surface-muted, #f0f0f0)",
                        borderRadius: "999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(100, Math.max(0, cat.score))}%`,
                          backgroundColor: cat.score >= 80 ? "var(--rose, #e11d48)" : "var(--primary, #4f46e5)",
                          borderRadius: "999px",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                ))}
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

      {p.prompts && p.prompts.length > 0 && (
        <Card variant="surface">
          <div className="stack-4">
            {p.prompts.map((q) => (
              <div key={q.question} className="stack-1">
                <Text variant="strong">{q.question}</Text>
                <Text>{q.answer}</Text>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Divider />
      <div className="row-2 wrap">
        <Button variant="ghost" size="sm" onClick={() => setReporting((v) => !v)}>
          Report
        </Button>
        <Button variant="ghost" size="sm" loading={block.isPending} onClick={() => block.mutate()}>
          Block
        </Button>
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
    </div>
  );
}
