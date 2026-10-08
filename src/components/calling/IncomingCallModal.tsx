import { useState } from "react";
import { Badge, Button, Card, Heading, Text } from "@/components/ui";
import { callsApi } from "@/lib/api/modules";
import { getSocket } from "@/lib/socket";
import { callAccepted, callRejected, useAppDispatch, useAppSelector } from "@/store";

export function IncomingCallModal() {
  const dispatch = useAppDispatch();
  const incomingCall = useAppSelector((state) => state.calling.incomingCall);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  if (!incomingCall) return null;

  const isVideo = incomingCall.kind === "VIDEO";

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const res = await callsApi.accept(incomingCall.callId);
      getSocket()?.emit("call:accept", { callId: incomingCall.callId });
      dispatch(
        callAccepted({
          call: res.call,
          url: res.call.url,
          roomName: res.call.roomName,
          token: res.call.token,
        })
      );
    } catch {
      // Fallback: accept locally with socket notification
      getSocket()?.emit("call:accept", { callId: incomingCall.callId });
      dispatch(callAccepted({ call: { ...incomingCall, status: "ACCEPTED" } }));
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      await callsApi.decline(incomingCall.callId);
      getSocket()?.emit("call:reject", { callId: incomingCall.callId });
    } catch {
      getSocket()?.emit("call:reject", { callId: incomingCall.callId });
    } finally {
      setIsDeclining(false);
      dispatch(callRejected(incomingCall));
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Incoming Call"
    >
      {/* Ringing sound (auto-plays in loop). Stops immediately when user clicks accept/decline. */}
      {!isAccepting && !isDeclining && (
        <audio autoPlay loop src="https://actions.google.com/sounds/v1/alarms/phone_ringing.ogg" />
      )}
      
      <Card style={{ maxWidth: "420px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
        <div className="stack-4" style={{ textAlign: "center", padding: "1.5rem 1rem" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              margin: "0 auto",
              borderRadius: "50%",
              backgroundColor: "var(--rose, #e11d48)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              animation: "pulse 1.5s infinite",
            }}
          >
            {isVideo ? "📹" : "📞"}
          </div>

          <div className="stack-1">
            <Heading level="h2">Incoming {isVideo ? "Video" : "Audio"} Call</Heading>
            <Text variant="small">
              {incomingCall.from ? `From: ${incomingCall.from}` : "Mutual Match is calling you..."}
            </Text>
            <div>
              <Badge variant="rose">LiveKit 1:1 Encrypted</Badge>
            </div>
          </div>

          <Text variant="caption">
            Ringing will automatically time out after 30 seconds if unanswered.
          </Text>

          <div className="row-2 wrap" style={{ justifyContent: "center", marginTop: "1rem" }}>
            <Button
              size="lg"
              variant="primary"
              style={{ backgroundColor: "#10b981", borderColor: "#10b981", color: "#fff", minWidth: "120px" }}
              onClick={handleAccept}
              loading={isAccepting}
              disabled={isDeclining}
            >
              ✓ Answer
            </Button>
            <Button
              size="lg"
              variant="outline"
              style={{ color: "#ef4444", borderColor: "#ef4444", minWidth: "120px" }}
              onClick={handleDecline}
              loading={isDeclining}
              disabled={isAccepting}
            >
              ✕ Decline
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
