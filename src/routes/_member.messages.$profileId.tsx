import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef } from "react";
import { Button, Card, Text, Textarea } from "@/components/ui";
import { ErrorState, LoadingState, ProfileSummary } from "@/components/ui";
import { aiApi, callsApi, chatApi, messagesQuery, profileQuery, qk } from "@/lib/api/modules";
import { getSocket } from "@/lib/socket";
import { callAccepted, useAppDispatch } from "@/store";

export const Route = createFileRoute("/_member/messages/$profileId")({
  head: () => ({
    meta: [
      { title: "Conversation — AI Marriage" },
      { name: "description", content: "A private conversation with your match." },
      { property: "og:title", content: "Conversation — AI Marriage" },
      { property: "og:description", content: "A private conversation with your match." },
    ],
  }),
  component: ChatPage,
});

const schema = z.object({ text: z.string().trim().min(1).max(2000) });

function ChatPage() {
  const { profileId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  const profile = useQuery(profileQuery(profileId));
  const { data: messages, isLoading, error } = useQuery({ ...messagesQuery(profileId), refetchInterval: 15_000 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, reset, setValue, formState } = useForm<{ text: string }>({
    resolver: zodResolver(schema),
  });

  const startCall = async (kind: "AUDIO" | "VIDEO") => {
    try {
      const res = await callsApi.initiate(profileId, kind);
      getSocket()?.emit("call:ring", { targetUserId: profileId, kind });
      dispatch(
        callAccepted({
          call: res.call,
          url: res.call.url,
          roomName: res.call.roomName,
          token: res.call.token,
        })
      );
    } catch {
      // Local fallback call session
      getSocket()?.emit("call:ring", { targetUserId: profileId, kind });
      dispatch(
        callAccepted({
          call: {
            callId: `call_${Date.now()}`,
            callerId: "me",
            calleeId: profileId,
            kind,
            status: "ACCEPTED",
          },
        })
      );
    }
  };

  useEffect(() => {
    const s = getSocket();
    s?.emit("join_room", { conversationId: profileId });
    return () => {
      s?.emit("leave_room", { conversationId: profileId });
    };
  }, [profileId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages?.length]);

  const send = useMutation({
    mutationFn: (text: string) => chatApi.send(profileId, text),
    onSuccess: () => {
      reset({ text: "" });
      qc.invalidateQueries({ queryKey: qk.messages(profileId) });
      qc.invalidateQueries({ queryKey: qk.conversations });
    },
  });
  const suggest = useMutation({
    mutationFn: () => aiApi.assist({ kind: "icebreaker", text: profile.data?.bio ?? "" }),
    onSuccess: (r) => {
      const s = r.choices?.[0]?.text;
      if (s) setValue("text", s);
    },
  });

  return (
    <div className="stack-4">
      <div className="row-3 between wrap">
        {profile.data ? <ProfileSummary profile={profile.data} /> : <span />}
        <div className="row-2 wrap">
          <Button variant="outline" size="sm" onClick={() => startCall("AUDIO")}>
            📞 Audio Call
          </Button>
          <Button variant="outline" size="sm" onClick={() => startCall("VIDEO")}>
            📹 Video Call
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/messages" })}>
            All messages
          </Button>
        </div>
      </div>
      <Card variant="surface">
        {isLoading && <LoadingState />}
        {error && <ErrorState error={error} />}
        <div className="chat-scroll" ref={scrollRef}>
          {messages?.length === 0 && <Text variant="small">Say hello — be yourself.</Text>}
          {messages?.map((m) => (
            <div key={m.id} className={m.from === "me" ? "bubble bubble--me" : "bubble"}>
              <Text>{m.text}</Text>
              <Text variant="caption">{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
            </div>
          ))}
        </div>
      </Card>
      <form className="stack-2" onSubmit={handleSubmit((v) => send.mutate(v.text))}>
        <Textarea aria-label="Message" rows={3} placeholder="Write a message…" {...register("text")} invalid={!!formState.errors.text} />
        {(send.error || suggest.error) && (
          <p className="ds-field__hint ds-field__hint--error" role="alert">
            {(send.error ?? suggest.error)?.message}
          </p>
        )}
        <div className="row-2">
          <Button type="submit" loading={send.isPending}>
            Send
          </Button>
          <Button variant="ghost" loading={suggest.isPending} onClick={() => suggest.mutate()}>
            Suggest a starter
          </Button>
        </div>
      </form>
    </div>
  );
}
