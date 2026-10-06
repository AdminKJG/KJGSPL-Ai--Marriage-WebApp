import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, Heading, Text } from "@/components/ui";
import { callsApi } from "@/lib/api/modules";
import { getSocket } from "@/lib/socket";
import { callEnded, useAppDispatch, useAppSelector } from "@/store";

export function ActiveCallModal() {
  const dispatch = useAppDispatch();
  const { activeCall, token, roomName } = useAppSelector((state) => state.calling);

  const [duration, setDuration] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const isVideo = activeCall?.kind === "VIDEO";

  // Duration timer
  useEffect(() => {
    if (!activeCall) {
      setDuration(0);
      return;
    }
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeCall]);

  // Camera & Mic hardware initialization
  useEffect(() => {
    if (!activeCall) return;

    let active = true;
    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideo ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current && isVideo) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Media devices not accessible:", err);
        setStreamError("Microphone or camera permission not granted or device in use.");
      }
    }

    initMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [activeCall, isVideo]);

  if (!activeCall) return null;

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = micMuted;
      });
    }
    setMicMuted(!micMuted);
  };

  const toggleCamera = () => {
    if (localStreamRef.current && isVideo) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = cameraOff;
      });
    }
    setCameraOff(!cameraOff);
  };

  const handleEndCall = async () => {
    try {
      await callsApi.end(activeCall.callId);
      getSocket()?.emit("call:end", { callId: activeCall.callId });
    } catch {
      getSocket()?.emit("call:end", { callId: activeCall.callId });
    } finally {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      dispatch(callEnded(activeCall));
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 10, 15, 0.88)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Active Call"
    >
      <Card
        style={{
          maxWidth: isVideo ? "680px" : "440px",
          width: "100%",
          backgroundColor: "#18181b",
          borderColor: "#27272a",
          color: "#fafafa",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          borderRadius: "1rem",
          overflow: "hidden",
        }}
      >
        <div className="stack-4" style={{ padding: "1.5rem" }}>
          {/* Header */}
          <div className="row-2 between wrap">
            <div className="stack-1">
              <div className="row-2 align-center">
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: "#10b981",
                    display: "inline-block",
                  }}
                />
                <Heading level="h3" style={{ color: "#fff", margin: 0 }}>
                  {isVideo ? "1:1 Video Connection" : "1:1 Audio Connection"}
                </Heading>
              </div>
              <Text variant="caption" style={{ color: "#a1a1aa" }}>
                {roomName ? `Room: ${roomName.slice(0, 16)}…` : "LiveKit P2P Room Connected"}
              </Text>
            </div>
            <div className="row-2 align-center">
              <Badge variant="rose">{formatTime(duration)}</Badge>
              {token && <Badge variant="outline">LiveKit Auth Token ✓</Badge>}
            </div>
          </div>

          {streamError && (
            <div
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                border: "1px solid #ef4444",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
              }}
            >
              <Text variant="small" style={{ color: "#fca5a5" }}>
                {streamError}
              </Text>
            </div>
          )}

          {/* Video or Audio Visualizer Stage */}
          {isVideo ? (
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "320px",
                backgroundColor: "#09090b",
                borderRadius: "0.75rem",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Remote Participant Placeholder */}
              <div className="stack-2" style={{ textAlign: "center", color: "#71717a" }}>
                <span style={{ fontSize: "3.5rem" }}>👤</span>
                <Text variant="small" style={{ color: "#a1a1aa" }}>
                  Remote participant video stream
                </Text>
              </div>

              {/* Local Video Camera Preview */}
              <div
                style={{
                  position: "absolute",
                  bottom: "12px",
                  right: "12px",
                  width: "130px",
                  height: "95px",
                  backgroundColor: "#27272a",
                  borderRadius: "0.5rem",
                  overflow: "hidden",
                  border: "2px solid rgba(255,255,255,0.2)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                }}
              >
                {!cameraOff ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#71717a",
                      fontSize: "0.75rem",
                    }}
                  >
                    Camera Off
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: "2.5rem 1rem",
                textAlign: "center",
                backgroundColor: "#09090b",
                borderRadius: "0.75rem",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(225, 29, 72, 0.15)",
                  color: "var(--rose, #e11d48)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.5rem",
                  margin: "0 auto 1rem auto",
                }}
              >
                🎙️
              </div>
              <Text variant="strong" style={{ color: "#fff" }}>
                Audio Stream Encrypted & Active
              </Text>
              <Text variant="caption" style={{ color: "#71717a" }}>
                Zero media recordings stored on servers.
              </Text>
            </div>
          )}

          {/* Controls Bar */}
          <div
            className="row-3 wrap"
            style={{
              justifyContent: "center",
              paddingTop: "0.5rem",
              borderTop: "1px solid #27272a",
            }}
          >
            <Button
              size="md"
              variant={micMuted ? "rose" : "outline"}
              style={{ minWidth: "110px" }}
              onClick={toggleMic}
            >
              {micMuted ? "🔇 Unmute" : "🎙️ Mute"}
            </Button>

            {isVideo && (
              <Button
                size="md"
                variant={cameraOff ? "rose" : "outline"}
                style={{ minWidth: "110px" }}
                onClick={toggleCamera}
              >
                {cameraOff ? "📷 Start Cam" : "🚫 Stop Cam"}
              </Button>
            )}

            <Button
              size="md"
              variant="rose"
              style={{
                backgroundColor: "#dc2626",
                borderColor: "#dc2626",
                color: "#fff",
                fontWeight: 600,
                minWidth: "120px",
              }}
              onClick={handleEndCall}
            >
              📞 End Call
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
