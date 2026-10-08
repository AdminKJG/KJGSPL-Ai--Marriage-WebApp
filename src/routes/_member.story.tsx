import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, Heading, Input, Label, Text, Textarea } from "@/components/ui";
import { ErrorState, LoadingState, PageHeader } from "@/components/ui";
import { connectionsQuery, qk, storyApi, storyQuery, voiceApi } from "@/lib/api/modules";
import type { DatePlan, StoryAnswer } from "@/lib/api/types";

export const Route = createFileRoute("/_member/story")({
  head: () => ({
    meta: [
      { title: "My story — AI Marriage" },
      { name: "description", content: "Answer story questions and coordinate mutual date plans." },
      { property: "og:title", content: "My story — AI Marriage" },
      { property: "og:description", content: "Answer story questions and coordinate mutual date plans." },
    ],
  }),
  component: StoryPage,
});

interface Question {
  id: string;
  title: string;
  choices: { id: string; label: string }[];
}

function StoryPage() {
  const { data, isLoading, error } = useQuery(storyQuery());
  const connections = useQuery(connectionsQuery());
  const questions: Question[] = data?.questions ?? [];
  const answers: StoryAnswer[] = data?.answers ?? [];
  const datePlans: DatePlan[] = data?.datePlans ?? [];
  const version: number = data?.questionnaireVersion ?? 1;

  const [activeTab, setActiveTab] = useState<"questions" | "datePlans">("questions");

  return (
    <>
      <PageHeader
        title="My Story & Experiences"
        subtitle="Share your rhythms, values, and coordinate thoughtful date proposals."
        actions={
          <div className="row-2 wrap">
            <Button
              size="sm"
              variant={activeTab === "questions" ? "primary" : "outline"}
              onClick={() => setActiveTab("questions")}
            >
              Questionnaire ({answers.length}/{questions.length})
            </Button>
            <Button
              size="sm"
              variant={activeTab === "datePlans" ? "primary" : "outline"}
              onClick={() => setActiveTab("datePlans")}
            >
              Date Proposals {datePlans.length > 0 && `(${datePlans.length})`}
            </Button>
          </div>
        }
      />

      {isLoading && (
        <div className="stack-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <div className="stack-3" style={{ padding: "1.5rem" }}>
                <div className="skeleton-shimmer" style={{ width: "60%", height: "1.5rem", borderRadius: "6px" }} />
                <div className="stack-2">
                  <div className="skeleton-shimmer" style={{ width: "100%", height: "3rem", borderRadius: "8px" }} />
                  <div className="skeleton-shimmer" style={{ width: "100%", height: "3rem", borderRadius: "8px" }} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {error && <ErrorState error={error} />}

      {activeTab === "questions" && (
        <div className="stack-4">
          {questions.map((q) => (
            <QuestionCard key={q.id} q={q} version={version} answer={answers.find((a) => a.questionId === q.id)} />
          ))}
        </div>
      )}

      {activeTab === "datePlans" && (
        <DatePlansSection datePlans={datePlans} mutuals={connections.data?.mutual ?? []} />
      )}
    </>
  );
}

function QuestionCard({ q, answer, version }: { q: Question; answer?: StoryAnswer; version: number }) {
  const qc = useQueryClient();
  const [choiceId, setChoiceId] = useState(answer?.choiceId ?? "");
  const [transcript, setTranscript] = useState(answer?.transcript ?? "");
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setChoiceId(answer?.choiceId ?? "");
    setTranscript(answer?.transcript ?? "");
  }, [answer?.choiceId, answer?.transcript]);

  const save = useMutation({
    mutationFn: () =>
      storyApi.saveAnswer(q.id, {
        questionnaireVersion: version,
        questionId: q.id,
        choiceId,
        transcript,
        reviewed: true,
        useForMatching: true,
        shareTranscript: true,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.story }),
  });

  const startRecording = async () => {
    try {
      setVoiceNotice(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setTranscribing(true);
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64 = (reader.result as string).split(",")[1];
            try {
              const res = await voiceApi.transcribe(base64);
              if (res?.text) {
                setTranscript((prev) => (prev ? `${prev} ${res.text}` : res.text));
                setVoiceNotice("Audio transcribed successfully!");
              }
            } catch {
              setVoiceNotice("Speech transcription microservice is offline or processing. You can type directly.");
            } finally {
              setTranscribing(false);
            }
          };
        } catch {
          setTranscribing(false);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setVoiceNotice("Microphone permission denied or not supported on this device.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  };

  return (
    <Card variant="surface">
      <div className="stack-4">
        <div className="row-2 between wrap">
          <Heading level="h3">{q.title}</Heading>
          {answer && <Badge variant="rose" dot>Answered</Badge>}
        </div>

        <div className="row-2 wrap" role="radiogroup" aria-label={q.title}>
          {q.choices.map((c) => (
            <Button
              key={c.id}
              size="sm"
              role="radio"
              aria-checked={choiceId === c.id}
              variant={choiceId === c.id ? "primary" : "outline"}
              onClick={() => setChoiceId(c.id)}
            >
              {c.label}
            </Button>
          ))}
        </div>

        <div className="stack-1">
          <div className="row-2 between wrap">
            <Label htmlFor={`t-${q.id}`}>In your own words</Label>
            <div className="row-2">
              {!isRecording ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={startRecording}
                  disabled={transcribing}
                >
                  🎙️ Speak Answer
                </Button>
              ) : (
                <Button size="sm" variant="rose" onClick={stopRecording}>
                  ⏹️ Stop Recording
                </Button>
              )}
            </div>
          </div>

          {isRecording && (
            <div className="row-2 align-center" style={{ color: "var(--rose, #e11d48)" }}>
              <span className="dot-pulse" style={{ width: "8px", height: "8px", borderRadius: "50%", background: "currentColor" }} />
              <Text variant="caption">Listening to your voice... Click Stop when finished.</Text>
            </div>
          )}

          {transcribing && <Text variant="caption">Processing audio transcript with Whisper AI…</Text>}
          {voiceNotice && <Text variant="caption">{voiceNotice}</Text>}

          <Textarea
            id={`t-${q.id}`}
            rows={3}
            placeholder="Tell your story or speak into the microphone..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
        </div>

        {save.error && <p className="ds-field__hint ds-field__hint--error" role="alert">{save.error.message}</p>}
        <div>
          <Button size="sm" disabled={!choiceId} loading={save.isPending} onClick={() => save.mutate()}>
            Save answer
          </Button>
        </div>
      </div>
    </Card>
  );
}

function DatePlansSection({ datePlans, mutuals }: { datePlans: DatePlan[]; mutuals: any[] }) {
  const qc = useQueryClient();
  const [partnerId, setPartnerId] = useState(mutuals[0]?.id ?? "");
  const [activity, setActivity] = useState("");
  const [venue, setVenue] = useState("");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [showProposeForm, setShowProposeForm] = useState(false);

  const proposeMutation = useMutation({
    mutationFn: (plan: { profileId: string; activity: string; venue: string; day: string; time: string; status: string }) =>
      storyApi.proposeDatePlan(plan.profileId, plan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.story });
      setShowProposeForm(false);
      setActivity("");
      setVenue("");
      setDay("");
      setTime("");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (profileId: string) => storyApi.cancelDatePlan(profileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.story }),
  });

  const respondMutation = useMutation({
    mutationFn: ({ plan, status }: { plan: DatePlan; status: "accepted" | "declined" }) =>
      storyApi.proposeDatePlan(plan.profileId, {
        activity: plan.activity,
        venue: plan.venue,
        day: plan.day,
        time: plan.time,
        status,
        revision: (plan.revision ?? 1) + 1,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.story }),
  });

  return (
    <div className="stack-6">
      <Card variant="surface">
        <div className="stack-4">
          <div className="row-2 between wrap">
            <Heading level="h2">Mutual Date Proposals</Heading>
            <Button
              size="sm"
              variant={showProposeForm ? "outline" : "primary"}
              onClick={() => setShowProposeForm(!showProposeForm)}
            >
              {showProposeForm ? "Cancel Proposal" : "+ Propose a Date"}
            </Button>
          </div>
          <Text variant="small">
            Collaborate on first-date details with your mutual connections in a respectful and structured way.
          </Text>

          {showProposeForm && (
            <Card>
              <div className="stack-4">
                <Heading level="h3">Plan a Meetup</Heading>

                <div className="stack-1">
                  <Label htmlFor="date-partner">Select Mutual Match</Label>
                  {mutuals.length === 0 ? (
                    <Text variant="small">You do not have any mutual connections yet to propose a date with.</Text>
                  ) : (
                    <select
                      id="date-partner"
                      className="ds-input"
                      value={partnerId}
                      onChange={(e) => setPartnerId(e.target.value)}
                      style={{ padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid var(--border, #ccc)" }}
                    >
                      {mutuals.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.city || "Member"})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid-2">
                  <div className="stack-1">
                    <Label htmlFor="date-activity">Activity</Label>
                    <Input
                      id="date-activity"
                      placeholder="e.g. Artisanal Coffee & Gallery Walk"
                      value={activity}
                      onChange={(e) => setActivity(e.target.value)}
                    />
                  </div>
                  <div className="stack-1">
                    <Label htmlFor="date-venue">Public Venue</Label>
                    <Input
                      id="date-venue"
                      placeholder="e.g. Alserkal Arts Cafe"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                    />
                  </div>
                  <div className="stack-1">
                    <Label htmlFor="date-day">Day / Date</Label>
                    <Input
                      id="date-day"
                      placeholder="e.g. Saturday or 2026-10-10"
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                    />
                  </div>
                  <div className="stack-1">
                    <Label htmlFor="date-time">Preferred Time</Label>
                    <Input
                      id="date-time"
                      placeholder="e.g. 18:00"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="row-2">
                  <Button
                    size="sm"
                    disabled={!partnerId || !activity.trim() || !venue.trim()}
                    loading={proposeMutation.isPending}
                    onClick={() =>
                      proposeMutation.mutate({
                        profileId: partnerId,
                        activity,
                        venue,
                        day,
                        time,
                        status: "pending",
                      })
                    }
                  >
                    Send Proposal
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {datePlans.length === 0 ? (
            <Text variant="small">No active date proposals yet. Once you connect with someone, propose a meetup!</Text>
          ) : (
            <div className="stack-3">
              {datePlans.map((plan, idx) => (
                <Card key={plan.profileId || idx}>
                  <div className="row-2 between wrap">
                    <div className="stack-2">
                      <div className="row-2 align-center">
                        <Heading level="h3">{plan.activity}</Heading>
                        <Badge
                          variant={
                            plan.status === "accepted"
                              ? "rose"
                              : plan.status === "declined"
                              ? "outline"
                              : "default"
                          }
                        >
                          {plan.status.toUpperCase()}
                        </Badge>
                      </div>
                      <Text variant="small">
                        📍 {plan.venue} · 🗓️ {plan.day} at {plan.time}
                      </Text>
                      {plan.bookingConfirmed && <Badge variant="rose">Venue Reservation Confirmed</Badge>}
                    </div>

                    <div className="row-2 wrap">
                      {plan.canRespond && plan.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            loading={respondMutation.isPending}
                            onClick={() => respondMutation.mutate({ plan, status: "accepted" })}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            loading={respondMutation.isPending}
                            onClick={() => respondMutation.mutate({ plan, status: "declined" })}
                          >
                            Decline
                          </Button>
                        </>
                      )}
                      {plan.status !== "cancelled" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={cancelMutation.isPending}
                          onClick={() => cancelMutation.mutate(plan.profileId)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

