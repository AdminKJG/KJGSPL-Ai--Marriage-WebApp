import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef, useState, type KeyboardEvent, type ChangeEvent } from "react";
import { Avatar, ErrorState, LoadingState } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { aiApi, callsApi, chatApi, messagesQuery, profileQuery, conversationsQuery, qk } from "@/lib/api/modules";
import { getSocket } from "@/lib/socket";
import { callAccepted, useAppDispatch } from "@/store";
import {
  ArrowLeftIcon,
  CheckCheckIcon,
  CloseIcon,
  DownloadIcon,
  FileTextIcon,
  PaperclipIcon,
  PhoneIcon,
  SendIcon,
  SmileIcon,
  SparklesIcon,
  VideoIcon,
} from "@/components/icons/NavIcons";

export const Route = createFileRoute("/_member/messages/$profileId")({
  head: () => ({
    meta: [
      { title: "Conversation — AI Marriage" },
      { name: "description", content: "A private conversation with your match." },
      { property: "og:title", content: "Conversation — AI Marriage" },
      { property: "og:description", content: "A private conversation with your match." },
    ],
  }),
  component: WhatsAppChatPage,
});

const schema = z.object({
  text: z.string().max(2000),
});

interface AttachmentState {
  file: File;
  previewUrl: string;
  type: "image" | "file";
  name: string;
  size: string;
}

const ChatThreadSkeleton = () => (
  <div className="stack-4" style={{ width: "100%", padding: "1rem" }}>
    <div style={{ alignSelf: "flex-start", width: "fit-content", maxWidth: "70%", display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
      <div style={{ padding: "0.85rem 1.1rem", background: "var(--card)", borderRadius: "16px 16px 16px 4px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.6rem", minWidth: "180px" }}>
        <div style={{ width: "100%", height: "12px", background: "var(--border)", borderRadius: "4px", animation: "pulse 1.5s infinite", opacity: 0.5 }} />
        <div style={{ width: "70%", height: "12px", background: "var(--border)", borderRadius: "4px", animation: "pulse 1.5s infinite", opacity: 0.5 }} />
      </div>
    </div>
    
    <div style={{ alignSelf: "flex-end", width: "fit-content", maxWidth: "70%", display: "flex", gap: "0.5rem", alignItems: "flex-end", marginTop: "1rem" }}>
      <div style={{ padding: "0.85rem 1.1rem", background: "var(--rose-active, #f43f5e)", borderRadius: "16px 16px 4px 16px", display: "flex", flexDirection: "column", gap: "0.6rem", minWidth: "220px", opacity: 0.4 }}>
        <div style={{ width: "100%", height: "12px", background: "var(--background)", borderRadius: "4px", animation: "pulse 1.5s infinite", opacity: 0.8 }} />
        <div style={{ width: "85%", height: "12px", background: "var(--background)", borderRadius: "4px", animation: "pulse 1.5s infinite", opacity: 0.8 }} />
      </div>
    </div>

    <div style={{ alignSelf: "flex-start", width: "fit-content", maxWidth: "70%", display: "flex", gap: "0.5rem", alignItems: "flex-end", marginTop: "1rem" }}>
      <div style={{ padding: "0.85rem 1.1rem", background: "var(--card)", borderRadius: "16px 16px 16px 4px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.6rem", minWidth: "120px" }}>
        <div style={{ width: "100%", height: "12px", background: "var(--border)", borderRadius: "4px", animation: "pulse 1.5s infinite", opacity: 0.5 }} />
      </div>
    </div>
  </div>
);

function WhatsAppChatPage() {
  const { profileId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  const profile = useQuery(profileQuery(profileId));
  const convos = useQuery(conversationsQuery());
  const conversation = convos.data?.find((c) => c.profileId === profileId);
  const conversationId = conversation?.id || "";

  const { data: messages, isLoading, error } = useQuery({
    ...messagesQuery(conversationId, profileId, conversation?.isBot ?? false),
    refetchInterval: 10_000,
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBot = conversation?.isBot ?? false;

  const [attachment, setAttachment] = useState<AttachmentState | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false);
  const { showError } = useToast();

  const { register, handleSubmit, reset, setValue, watch } = useForm<{ text: string }>({
    resolver: zodResolver(schema),
    defaultValues: { text: "" },
  });

  const textValue = watch("text");
  const [callingKind, setCallingKind] = useState<"AUDIO" | "VIDEO" | null>(null);

  const startCall = async (kind: "AUDIO" | "VIDEO") => {
    if (isBot) {
      alert("This member is currently offline for direct calls. Continue chatting to plan a call!");
      return;
    }
    
    try {
      const res = await callsApi.initiate(profileId, kind);
      getSocket()?.emit("call:ring", { targetUserId: profileId, ...res.call });
      dispatch(
        callAccepted({
          call: res.call,
          url: res.call.url,
          roomName: res.call.roomName,
          token: res.call.token,
        })
      );
    } catch (err: any) {
      if (err?.status === 409) {
        alert(err.message || "One of you is already on a call.");
        return;
      }
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
    } finally {
      setCallingKind(null);
    }
  };

  useEffect(() => {
    const s = getSocket();
    if (conversationId) s?.emit("join_room", { conversationId });

    let typingTimeout: ReturnType<typeof setTimeout> | null = null;

    const clearTypingTimeout = () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
      }
    };

    const handleTypingStart = (p: { conversationId: string }) => {
      if (p.conversationId === conversationId) {
        setIsBotTyping(true);
        clearTypingTimeout();
        // Safety Timeout: 12 seconds
        // If a network hiccup drops the stop event, this clears the bubble automatically.
        typingTimeout = setTimeout(() => {
          setIsBotTyping(false);
        }, 12000);
      }
    };
    
    const handleTypingStop = (p: { conversationId: string }) => {
      if (p.conversationId === conversationId) {
        setIsBotTyping(false);
        clearTypingTimeout();
      }
    };
    
    const handleMessageReceived = (m: { conversationId: string }) => {
      if (m.conversationId === conversationId) {
        setIsBotTyping(false);
        clearTypingTimeout();
        qc.invalidateQueries({ queryKey: qk.messages(conversationId) });
        qc.invalidateQueries({ queryKey: qk.conversations });
      }
    };

    s?.on("bot_typing_started", handleTypingStart);
    s?.on("bot_typing_stopped", handleTypingStop);
    s?.on("message_received", handleMessageReceived);

    return () => {
      if (conversationId) s?.emit("leave_room", { conversationId });
      s?.off("bot_typing_started", handleTypingStart);
      s?.off("bot_typing_stopped", handleTypingStop);
      s?.off("message_received", handleMessageReceived);
    };
  }, [conversationId, qc]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    
    // Mark messages as read
    if (messages && messages.length > 0 && conversationId) {
      const unreadIds = messages.filter((m) => m.from === profileId).map((m) => m.id);
      if (unreadIds.length > 0) {
        chatApi.readMessage(conversationId, unreadIds.slice(-5), isBot).catch(() => {});
      }
    }
  }, [messages?.length, conversationId, profileId]);

  const send = useMutation({
    mutationFn: async (payload: { text?: string; attachment?: AttachmentState | null }) => {
      const text = payload.text?.trim() || "";
      
      // If human, send via Socket
      if (!isBot && getSocket() && conversationId) {
        getSocket()?.emit("send_message", {
          conversationId,
          content: text || payload.attachment?.name,
          type: payload.attachment?.type === "image" ? "IMAGE" : payload.attachment ? "DOCUMENT" : "TEXT",
        });
        // We still resolve so the UI clears the input optimistically
        return { success: true };
      }

      // If bot or no socket, use REST API
      if (conversationId) {
        if (payload.attachment && payload.attachment.file) {
          return chatApi.uploadAndSendMedia(payload.attachment.file, conversationId, text, isBot);
        }
        return chatApi.send(conversationId, { text, type: "TEXT" }, isBot);
      }
      throw new Error("No conversation ID");
    },
    onSuccess: () => {
      if (conversationId) {
        qc.invalidateQueries({ queryKey: qk.messages(conversationId) });
      }
      qc.invalidateQueries({ queryKey: qk.conversations });
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
    },
    onError: (err: Error) => {
      showError(err.message || "Failed to send message. Please try again.", "Message Failed");
    },
    onSettled: () => {
      send.reset();
    },
  });

  const suggest = useMutation({
    mutationFn: () => aiApi.assist({ kind: "icebreaker", text: profile.data?.bio ?? "" }),
    onSuccess: (r) => {
      const s = r.choices?.[0]?.text;
      if (s) setValue("text", s);
    },
  });

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit.");
      return;
    }

    const isImg = file.type.startsWith("image/");
    const formattedSize =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = (evt.target?.result as string) || "";
      setAttachment({
        file,
        previewUrl: result,
        type: isImg ? "image" : "file",
        name: file.name,
        size: formattedSize,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleClearAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const submitMessage = (v: { text?: string }) => {
    const textToSend = v.text;
    const currentAttachment = attachment;
    if (!textToSend?.trim() && !currentAttachment) return;
    reset({ text: "" });
    handleClearAttachment();
    send.mutate({ text: textToSend, attachment: currentAttachment });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (textValue?.trim() || attachment) {
        handleSubmit(submitMessage)();
      }
    }
  };

  const targetName = profile.data?.name?.trim() || "Mutual Match";
  const targetMeta = [
    profile.data?.age ? `${profile.data.age} yrs` : null,
    profile.data?.city,
  ].filter(Boolean).join(" · ");

  return (
    <div className="whatsapp-chat-container">
      {/* WhatsApp Header */}
      <header className="whatsapp-chat-header">
        <div className="row-2 align-center" style={{ gap: "0.5rem" }}>
          <button
            type="button"
            className="whatsapp-header-btn mobile-back-btn"
            onClick={() => navigate({ to: "/messages" })}
            title="Back to conversations"
            aria-label="Back to conversations"
          >
            <ArrowLeftIcon size={20} />
          </button>

          <div
            className="whatsapp-chat-header-user"
            onClick={() => navigate({ to: "/profile/$id", params: { id: profileId } })}
            title={`View ${targetName}'s profile`}
          >
            {profile.data && (
              <div className="whatsapp-avatar-wrapper">
                <Avatar profile={profile.data} />
                <span className="whatsapp-online-badge" />
              </div>
            )}
            <div className="whatsapp-chat-header-info">
              <h2 className="whatsapp-chat-header-name">{targetName}</h2>
              <span className="whatsapp-chat-header-status">
                🟢 {targetMeta || "Online"}
              </span>
            </div>
          </div>
        </div>

        <div className="whatsapp-chat-header-actions">
          <button
            type="button"
            className="whatsapp-header-btn"
            onClick={() => startCall("AUDIO")}
            title="Start Audio Call"
            aria-label="Start Audio Call"
            disabled={callingKind !== null}
            style={{ opacity: callingKind === "AUDIO" ? 0.5 : 1 }}
          >
            <PhoneIcon size={20} />
          </button>
          <button
            type="button"
            className="whatsapp-header-btn"
            onClick={() => startCall("VIDEO")}
            title="Start Video Call"
            aria-label="Start Video Call"
            disabled={callingKind !== null}
            style={{ opacity: callingKind === "VIDEO" ? 0.5 : 1 }}
          >
            <VideoIcon size={20} />
          </button>
        </div>
      </header>

      {/* WhatsApp Wallpaper Chat Thread */}
      <div className="whatsapp-chat-wall" ref={scrollRef}>
        {isLoading && <ChatThreadSkeleton />}
        {error && <ErrorState error={error} />}

        {!isLoading && messages?.length === 0 && (
          <div className="whatsapp-date-pill">
            🔒 End-to-end encrypted · Say hi to {targetName}!
          </div>
        )}

        {messages && messages.length > 0 && (
          <div className="whatsapp-date-pill">
            Today
          </div>
        )}

        {messages?.map((m) => {
          const isMe = m.from === "me";
          const formattedTime = new Date(m.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          // If message is call event log
          if (m.text?.toLowerCase().includes("call")) {
            return (
              <div key={m.id} className="whatsapp-bubble whatsapp-bubble--call">
                <PhoneIcon size={18} style={{ color: "var(--rose, #e11d48)" }} />
                <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{m.text}</span>
                <span className="whatsapp-bubble-footer" style={{ marginTop: 0 }}>
                  {formattedTime}
                </span>
              </div>
            );
          }

          const isImage = m.type === "image" || Boolean(m.mediaUrl && m.mediaUrl.startsWith("data:image"));
          const isFile = m.type === "file" || Boolean(m.fileName && m.mediaUrl && !isImage);

          const hideDefaultText =
            isImage && m.text === "📷 Image"
              ? true
              : isFile && m.text === `📄 ${m.fileName || "Attachment"}`
              ? true
              : false;

          return (
            <div
              key={m.id}
              className={`whatsapp-bubble ${
                isMe ? "whatsapp-bubble--outgoing" : "whatsapp-bubble--incoming"
              }`}
            >
              {/* Image attachment rendering */}
              {isImage && m.mediaUrl && (
                <div
                  className="whatsapp-bubble-image-wrapper"
                  onClick={() => setLightboxUrl(m.mediaUrl!)}
                  title="Click to expand photo"
                >
                  <img src={m.mediaUrl} alt="Shared image" className="whatsapp-bubble-image" />
                </div>
              )}

              {/* Document / File attachment rendering */}
              {isFile && m.mediaUrl && (
                <a
                  href={m.mediaUrl}
                  download={m.fileName || "attachment"}
                  className="whatsapp-bubble-file"
                  title="Click to download file"
                >
                  <div className="whatsapp-file-icon-box">
                    <FileTextIcon size={20} />
                  </div>
                  <div className="whatsapp-file-info">
                    <span className="whatsapp-file-name">{m.fileName || "File Attachment"}</span>
                    <span className="whatsapp-file-size">{m.fileSize || "Download"}</span>
                  </div>
                  <DownloadIcon size={18} style={{ color: "var(--foreground-muted, #888)" }} />
                </a>
              )}

              {/* Text rendering */}
              {m.text && !hideDefaultText && <div className="whatsapp-bubble-text">{m.text}</div>}

              <div className="whatsapp-bubble-footer">
                <span>{formattedTime}</span>
                {isMe && (
                  <span className="whatsapp-check-icon">
                    <CheckCheckIcon size={16} />
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {isBotTyping && (
          <div className="whatsapp-bubble whatsapp-bubble--incoming" style={{ padding: "0.75rem", width: "fit-content", minWidth: 0 }}>
            <div className="whatsapp-typing-indicator" style={{ display: "flex", gap: "4px", alignItems: "center", height: "20px" }}>
              <span className="dot" style={{ width: "8px", height: "8px", backgroundColor: "#888", borderRadius: "50%", animation: "typing 1.4s infinite ease-in-out both" }}></span>
              <span className="dot" style={{ width: "8px", height: "8px", backgroundColor: "#888", borderRadius: "50%", animation: "typing 1.4s infinite ease-in-out both", animationDelay: "0.2s" }}></span>
              <span className="dot" style={{ width: "8px", height: "8px", backgroundColor: "#888", borderRadius: "50%", animation: "typing 1.4s infinite ease-in-out both", animationDelay: "0.4s" }}></span>
            </div>
            <style>{`
              @keyframes typing {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1); }
              }
            `}</style>
          </div>
        )}
      </div>

      {/* Lightbox photo modal */}
      {lightboxUrl && (
        <div className="whatsapp-lightbox-overlay" onClick={() => setLightboxUrl(null)}>
          <button
            type="button"
            className="whatsapp-lightbox-close"
            onClick={() => setLightboxUrl(null)}
            title="Close preview"
          >
            <CloseIcon size={22} />
          </button>
          <img src={lightboxUrl} alt="Full resolution preview" className="whatsapp-lightbox-img" />
        </div>
      )}

      {/* WhatsApp Bottom Input Bar */}
      <div className="whatsapp-input-bar">
        <button
          type="button"
          className="whatsapp-starter-chip"
          onClick={() => suggest.mutate()}
          disabled={suggest.isPending}
        >
          <SparklesIcon size={16} />
          {suggest.isPending ? "Generating starter…" : "Suggest AI Starter"}
        </button>

        {/* Attachment preview banner before sending */}
        {attachment && (
          <div className="whatsapp-attachment-preview">
            <div className="row-2 align-center" style={{ gap: "0.75rem" }}>
              {attachment.type === "image" ? (
                <img
                  src={attachment.previewUrl}
                  alt="Attachment preview"
                  className="whatsapp-attachment-thumb"
                />
              ) : (
                <div className="whatsapp-attachment-icon">
                  <FileTextIcon size={22} />
                </div>
              )}
              <div className="stack-1">
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    maxWidth: "220px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {attachment.name}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--foreground-muted, #888)" }}>
                  {attachment.size}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearAttachment}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.25rem",
                color: "var(--foreground-muted, #666)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Remove attachment"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        )}

        <form className="whatsapp-input-form" onSubmit={handleSubmit(submitMessage)}>
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: "none" }}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />

          <div className="whatsapp-input-wrapper">
            <button type="button" className="whatsapp-icon-btn" title="Emoji" tabIndex={-1}>
              <SmileIcon size={20} />
            </button>
            <input
              type="text"
              className="whatsapp-input-field"
              placeholder="Type a message..."
              autoComplete="off"
              {...register("text")}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              className="whatsapp-icon-btn"
              title="Attach photo or file"
              onClick={() => fileInputRef.current?.click()}
            >
              <PaperclipIcon size={20} />
            </button>
          </div>

          <button
            type="submit"
            className="whatsapp-send-btn"
            disabled={!textValue?.trim() && !attachment}
            title="Send Message"
            aria-label="Send Message"
          >
            <SendIcon size={18} style={{ marginLeft: "2px" }} />
          </button>
        </form>
      </div>
    </div>
  );
}
