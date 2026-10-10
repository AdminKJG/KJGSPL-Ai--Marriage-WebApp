import { useEffect, useRef, useState } from "react";
import { createLocalTracks, Room, RoomEvent, Track } from "livekit-client";
import { Badge, Button, Card, Heading, Text } from "@/components/ui";
import { callsApi } from "@/lib/api/modules";
import { getSocket } from "@/lib/socket";
import { callEnded, useAppDispatch, useAppSelector } from "@/store";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export function ActiveCallModal() {
  const dispatch = useAppDispatch();
  const { activeCall, token: storeToken, url: storeUrl, roomName: storeRoomName } = useAppSelector(
    (state) => state.calling
  );
  const user = useAppSelector((state) => state.auth.user);

  const [duration, setDuration] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const livekitRoomRef = useRef<Room | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);

  const isVideo = activeCall?.kind === "VIDEO";
  const livekitUrl = storeUrl ?? activeCall?.url ?? null;
  const livekitToken = storeToken ?? activeCall?.token ?? null;
  const displayRoomName = storeRoomName ?? activeCall?.roomName ?? null;

  // Determine target recipient user ID
  const targetUserId =
    user?.id === activeCall?.callerId ? activeCall?.calleeId : activeCall?.callerId;

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

  // LiveKit / WebRTC Media Connection Setup
  useEffect(() => {
    if (!activeCall) return;

    let active = true;

    async function initMediaSession() {
      if (!activeCall) return;
      const callId = activeCall.callId;

      // Acquire local media preview immediately so user always sees their camera right away
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
        if (!active) {
          localStream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = localStream;
        if (localVideoRef.current && isVideo) {
          localVideoRef.current.srcObject = localStream;
        }
        console.log(`🎥 [ActiveCall] Local media preview ready — tracks: ${localStream.getTracks().length}`);
      } catch (err) {
        console.warn("⚠️ [ActiveCall] Could not acquire local media preview:", err);
        setStreamError("Microphone or camera permission not granted or device in use.");
      }

      // Option A: LiveKit SFU Connection (When livekitUrl and livekitToken are provided by backend)
      if (livekitUrl && livekitToken) {
        console.log(`🎥 [LiveKit] Connecting to LiveKit Server: ${livekitUrl} (Room: ${displayRoomName})`);
        try {
          const room = new Room({
            adaptiveStream: true,
            dynacast: true,
          });
          livekitRoomRef.current = room;

          const attachTrack = (track: Track, identity?: string) => {
            console.log(`🎥 [LiveKit] Attaching remote track: ${track.kind} from ${identity ?? "peer"}`);
            if (track.kind === Track.Kind.Video && remoteVideoRef.current && isVideo) {
              track.attach(remoteVideoRef.current);
              setHasRemoteVideo(true);
            }
            if (track.kind === Track.Kind.Audio && remoteAudioRef.current) {
              track.attach(remoteAudioRef.current);
              remoteAudioRef.current.play().catch((err) => console.warn("LiveKit audio autoplay:", err));
            }
          };

          room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
            attachTrack(track, participant.identity);
          });

          room.on(RoomEvent.TrackUnsubscribed, (track) => {
            console.log(`🎥 [LiveKit] Remote track unsubscribed: ${track.kind}`);
            track.detach();
            if (track.kind === Track.Kind.Video) {
              setHasRemoteVideo(false);
            }
          });

          room.on(RoomEvent.Disconnected, () => {
            console.log("⬛ [LiveKit] Room disconnected");
          });

          await room.connect(livekitUrl, livekitToken);
          if (!active) {
            room.disconnect();
            return;
          }
          console.log(`🟢 [LiveKit] Successfully joined LiveKit room: ${room.name}`);

          // Attach any remote participant tracks that were ALREADY subscribed upon join
          room.remoteParticipants.forEach((participant) => {
            participant.trackPublications.forEach((pub) => {
              if (pub.isSubscribed && pub.track) {
                attachTrack(pub.track, participant.identity);
              }
            });
          });

          // Publish local tracks to LiveKit room cleanly
          try {
            const localTracks = await createLocalTracks({
              audio: true,
              video: isVideo ? true : false,
            });

            for (const track of localTracks) {
              if (track.kind === Track.Kind.Video && localVideoRef.current && isVideo) {
                track.attach(localVideoRef.current);
              }
              room.localParticipant.publishTrack(track).catch((pubErr) => {
                console.warn("⚠️ [LiveKit] Local track publish non-fatal error:", pubErr);
              });
            }
          } catch (pubErr) {
            console.warn("⚠️ [LiveKit] Local track creation non-fatal error:", pubErr);
          }
          return;
        } catch (err) {
          console.warn("⚠️ [LiveKit] LiveKit room connection error, continuing to WebRTC fallback:", err);
        }
      }

      // Option B: Standard WebRTC P2P Connection Fallback
      console.log(`🎥 [ActiveCall] Initializing P2P WebRTC — audio: true, video: ${isVideo}`);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current && isVideo) {
          localVideoRef.current.srcObject = stream;
        }

        const pc = new RTCPeerConnection(RTC_CONFIG);
        peerConnectionRef.current = pc;

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        pc.ontrack = (event) => {
          console.log("🎥 [WebRTC] Remote track received:", event.track.kind);
          const [remoteStream] = event.streams;

          if (remoteVideoRef.current && isVideo) {
            remoteVideoRef.current.srcObject = remoteStream;
            setHasRemoteVideo(true);
          }
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.play().catch((err) => console.warn("Audio autoplay blocked:", err));
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate && targetUserId && callId) {
            const socket = getSocket();
            const payload = { targetUserId, callId, candidate: event.candidate };
            socket?.emit("webrtc:candidate", payload);
            socket?.emit("call:candidate", payload);
          }
        };

        const createAndSendOffer = async () => {
          if (!targetUserId || !callId || pc.signalingState === "closed") return;
          try {
            console.log("📡 [WebRTC] Creating & sending offer for target:", targetUserId);
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: isVideo,
            });
            await pc.setLocalDescription(offer);

            const socket = getSocket();
            const payload = { targetUserId, callId, callerId: user?.id, offer };
            socket?.emit("webrtc:offer", payload);
            socket?.emit("call:offer", payload);
            socket?.emit("call:signal", { ...payload, type: "offer" });
          } catch (err) {
            console.warn("⚠️ [WebRTC] Error creating offer:", err);
          }
        };

        const handleIncomingOffer = async (data: { offer: RTCSessionDescriptionInit; callerId?: string }) => {
          console.log("📡 [WebRTC] Received offer from caller");
          try {
            if (pc.signalingState !== "stable") {
              await Promise.all([
                pc.setLocalDescription({ type: "rollback" }),
                pc.setRemoteDescription(new RTCSessionDescription(data.offer)),
              ]);
            } else {
              await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            }

            while (iceCandidateQueueRef.current.length > 0) {
              const cand = iceCandidateQueueRef.current.shift();
              if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            const senderId = data.callerId || targetUserId;
            const socket = getSocket();
            const payload = { targetUserId: senderId, callId, answer };
            socket?.emit("webrtc:answer", payload);
            socket?.emit("call:answer", payload);
            socket?.emit("call:signal", { ...payload, type: "answer" });
          } catch (err) {
            console.warn("⚠️ [WebRTC] Error handling offer:", err);
          }
        };

        const handleIncomingAnswer = async (data: { answer: RTCSessionDescriptionInit }) => {
          console.log("📡 [WebRTC] Received answer from callee");
          try {
            if (pc.signalingState === "have-local-offer") {
              await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
              while (iceCandidateQueueRef.current.length > 0) {
                const cand = iceCandidateQueueRef.current.shift();
                if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
              }
            }
          } catch (err) {
            console.warn("⚠️ [WebRTC] Error setting remote answer:", err);
          }
        };

        const handleIncomingCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
          try {
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } else {
              iceCandidateQueueRef.current.push(data.candidate);
            }
          } catch (err) {
            console.warn("⚠️ [WebRTC] Error adding candidate:", err);
          }
        };

        const socket = getSocket();
        if (socket) {
          socket.on("webrtc:offer", handleIncomingOffer);
          socket.on("call:offer", handleIncomingOffer);

          socket.on("webrtc:answer", handleIncomingAnswer);
          socket.on("call:answer", handleIncomingAnswer);

          socket.on("webrtc:candidate", handleIncomingCandidate);
          socket.on("call:candidate", handleIncomingCandidate);
          socket.on("call:ice-candidate", handleIncomingCandidate);

          socket.on("call:accepted", () => {
            if (user?.id === activeCall.callerId) {
              createAndSendOffer();
            }
          });
        }

        if (user?.id === activeCall.callerId) {
          await createAndSendOffer();
        }
      } catch (err) {
        console.warn("⚠️ [ActiveCall] Media setup failed:", err);
        setStreamError("Microphone or camera permission not granted or device in use.");
      }
    }

    initMediaSession();

    return () => {
      active = false;
      const socket = getSocket();
      socket?.off("webrtc:offer");
      socket?.off("call:offer");
      socket?.off("webrtc:answer");
      socket?.off("call:answer");
      socket?.off("webrtc:candidate");
      socket?.off("call:candidate");
      socket?.off("call:ice-candidate");
      socket?.off("call:accepted");

      if (livekitRoomRef.current) {
        console.log("⬛ [LiveKit] Disconnecting room on unmount");
        livekitRoomRef.current.disconnect();
        livekitRoomRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [activeCall, isVideo, user?.id, targetUserId, livekitUrl, livekitToken, displayRoomName]);

  const [isExpanded, setIsExpanded] = useState(true);

  if (!activeCall) return null;

  const toggleMic = async () => {
    const newMuted = !micMuted;
    setMicMuted(newMuted);

    if (livekitRoomRef.current) {
      await livekitRoomRef.current.localParticipant.setMicrophoneEnabled(!newMuted);
    } else if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !newMuted;
      });
    }
    console.log(`🔇 [ActiveCall] Mic ${newMuted ? "MUTED" : "UNMUTED"}`);
  };

  const toggleCamera = async () => {
    const newOff = !cameraOff;
    setCameraOff(newOff);

    if (livekitRoomRef.current) {
      await livekitRoomRef.current.localParticipant.setCameraEnabled(!newOff);
    } else if (localStreamRef.current && isVideo) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !newOff;
      });
    }
    console.log(`📷 [ActiveCall] Camera ${newOff ? "OFF" : "ON"}`);
  };

  const handleEndCall = () => {
    if (isEnding) return;
    console.log(`🔴 [ActiveCall] End Call button clicked — callId: ${activeCall?.callId}, duration: ${duration}s`);
    setIsEnding(true);

    const callId = activeCall?.callId;
    if (callId) {
      // Send instant socket notification to peer so remote side terminates immediately
      getSocket()?.emit("call:end", { callId });
      // Call REST end API in background (non-blocking)
      callsApi.end(callId).catch((err) => {
        console.warn("⚠️ [ActiveCall] Background REST end call non-fatal warning:", err);
      });
    }

    // Clean up local tracks & room connections immediately
    if (livekitRoomRef.current) {
      livekitRoomRef.current.disconnect();
      livekitRoomRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    // Dispatch Redux callEnded action to close modal right away
    if (activeCall) {
      dispatch(callEnded(activeCall));
    }
    console.log("⬛ [ActiveCall] Call ended — modal closed instantly, media tracks stopped");
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
        backgroundColor: isExpanded ? "rgba(9, 9, 11, 0.96)" : "transparent",
        backdropFilter: isExpanded ? "blur(24px)" : "none",
        WebkitBackdropFilter: isExpanded ? "blur(24px)" : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "0",
        pointerEvents: isExpanded ? "auto" : "none",
        transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Active Call"
    >
      {/* Hidden Audio element for playing remote participant's voice */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />

      <div
        style={{
          position: isExpanded ? "relative" : "fixed",
          bottom: isExpanded ? "auto" : "24px",
          right: isExpanded ? "auto" : "24px",
          width: isExpanded ? "100vw" : "320px",
          height: isExpanded ? "100vh" : "200px",
          backgroundColor: "#09090b",
          border: isExpanded ? "none" : "1px solid rgba(255, 255, 255, 0.18)",
          borderRadius: isExpanded ? "0px" : "1.25rem",
          boxShadow: isExpanded ? "none" : "0 25px 50px -12px rgba(0, 0, 0, 0.85)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          pointerEvents: "auto",
          transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Main Stage Container */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            backgroundColor: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Top Glassmorphic Header Bar Overlay */}
          <div
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              right: "16px",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.6rem 1.2rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(24, 24, 27, 0.75)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#fff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: "#10b981",
                  boxShadow: "0 0 10px #10b981",
                  display: "inline-block",
                  animation: "pulse 1.5s infinite",
                }}
              />
              <span style={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.02em" }}>
                {isVideo ? "HD Video Call" : "HD Voice Call"}
              </span>
              <span style={{ fontSize: "0.75rem", opacity: 0.6, display: isExpanded ? "inline" : "none" }}>
                · 🔒 End-to-End Encrypted
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(244, 63, 94, 0.2)",
                  color: "#f43f5e",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  letterSpacing: "0.04em",
                }}
              >
                ⏱️ {formatTime(duration)}
              </span>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Minimize Window" : "Expand Fullscreen"}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "#fff",
                  padding: "0.4rem 0.6rem",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                {isExpanded ? "🗗 Minimize" : "🗖 Expand"}
              </button>
            </div>
          </div>

          {/* Stream Error Alert if any */}
          {streamError && (
            <div
              style={{
                position: "absolute",
                top: "70px",
                zIndex: 11,
                backgroundColor: "rgba(239, 68, 68, 0.2)",
                border: "1px solid #ef4444",
                color: "#fca5a5",
                padding: "0.5rem 1rem",
                borderRadius: "0.75rem",
                fontSize: "0.85rem",
              }}
            >
              ⚠️ {streamError}
            </div>
          )}

          {/* Video or Audio Stage */}
          {isVideo ? (
            <>
              {/* Main Remote Participant Video Feed */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: hasRemoteVideo ? "block" : "none",
                }}
              />

              {!hasRemoteVideo && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "1rem",
                    color: "#a1a1aa",
                  }}
                >
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(244, 63, 94, 0.15)",
                      color: "#f43f5e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "2.75rem",
                      boxShadow: "0 0 25px rgba(244, 63, 94, 0.3)",
                      animation: "pulse 1.5s infinite",
                    }}
                  >
                    📹
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>
                      Connecting Live Remote Video…
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#71717a", marginTop: "0.25rem" }}>
                      Waiting for participant media stream
                    </div>
                  </div>
                </div>
              )}

              {/* Picture-in-Picture Local Video Camera Preview */}
              <div
                style={{
                  position: "absolute",
                  bottom: isExpanded ? "90px" : "12px",
                  right: isExpanded ? "24px" : "12px",
                  width: isExpanded ? "200px" : "100px",
                  height: isExpanded ? "140px" : "70px",
                  backgroundColor: "#18181b",
                  borderRadius: "1rem",
                  overflow: "hidden",
                  border: "2px solid rgba(244, 63, 94, 0.5)",
                  boxShadow: "0 12px 30px rgba(0, 0, 0, 0.7)",
                  zIndex: 10,
                  transition: "all 0.3s ease",
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
                    Cam Off
                  </div>
                )}
              </div>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "1.25rem",
                color: "#fff",
              }}
            >
              <div
                style={{
                  width: "110px",
                  height: "110px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "3.5rem",
                  boxShadow: "0 0 35px rgba(16, 185, 129, 0.25)",
                  animation: "pulse 1.5s infinite",
                }}
              >
                🎙️
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#fff" }}>
                  Live Audio Connection Active
                </div>
                <div style={{ fontSize: "0.9rem", color: "#a1a1aa", marginTop: "0.35rem" }}>
                  Crystal-clear encrypted voice transmission
                </div>
              </div>
            </div>
          )}

          {/* Bottom Floating Glassmorphic Controls Bar */}
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 20,
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "0.75rem 1.75rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(24, 24, 27, 0.85)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            }}
          >
            {/* Mute Mic Button */}
            <button
              type="button"
              onClick={toggleMic}
              title={micMuted ? "Unmute Microphone" : "Mute Microphone"}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                border: "none",
                backgroundColor: micMuted ? "#ef4444" : "rgba(255, 255, 255, 0.15)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {micMuted ? "🔇" : "🎙️"}
            </button>

            {/* Toggle Camera Button */}
            {isVideo && (
              <button
                type="button"
                onClick={toggleCamera}
                title={cameraOff ? "Turn Camera On" : "Turn Camera Off"}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: cameraOff ? "#ef4444" : "rgba(255, 255, 255, 0.15)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {cameraOff ? "🚫" : "📷"}
              </button>
            )}

            {/* End Call Button */}
            <button
              type="button"
              onClick={handleEndCall}
              disabled={isEnding}
              title="End Call"
              style={{
                height: isExpanded ? "52px" : "36px",
                padding: isExpanded ? "0 1.75rem" : "0 1rem",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: isEnding ? "#991b1b" : "#dc2626",
                opacity: isEnding ? 0.75 : 1,
                color: "#fff",
                fontWeight: 700,
                fontSize: isExpanded ? "1rem" : "0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: isEnding ? "not-allowed" : "pointer",
                boxShadow: "0 0 25px rgba(220, 38, 38, 0.6)",
                transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                transform: isEnding ? "scale(0.95)" : "scale(1)",
              }}
            >
              <span>{isEnding ? "⏳" : "📞"}</span>
              {isExpanded && <span>{isEnding ? "Ending..." : "End Call"}</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

