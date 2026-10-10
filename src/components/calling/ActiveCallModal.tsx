import { useEffect, useRef, useState } from "react";
import { createLocalTracks, Room, RoomEvent, Track } from "livekit-client";
import { useQuery } from "@tanstack/react-query";
import { callsApi, profileQuery } from "@/lib/api/modules";
import { getSocket } from "@/lib/socket";
import { callEnded, clearCall, useAppDispatch, useAppSelector } from "@/store";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

function MicIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function MicOffIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function VideoIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function VideoOffIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
    </svg>
  );
}

function PhoneEndIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <line x1="23" y1="1" x2="1" y2="23" />
    </svg>
  );
}

export function ActiveCallModal() {
  const dispatch = useAppDispatch();
  const { activeCall, token: storeToken, url: storeUrl, roomName: storeRoomName } = useAppSelector(
    (state) => state.calling
  );
  const user = useAppSelector((state) => state.auth.user);

  const [duration, setDuration] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [remoteCameraOff, setRemoteCameraOff] = useState(false);
  const [remoteMicMuted, setRemoteMicMuted] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

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

  // Determine target recipient user ID & fetch profile
  const targetUserId =
    user?.id === activeCall?.callerId ? activeCall?.calleeId : activeCall?.callerId;

  const targetProfile = useQuery({
    ...profileQuery(targetUserId ?? ""),
    enabled: Boolean(targetUserId),
  });

  const targetName = targetProfile.data?.name?.trim() || "Participant";
  const targetFirstName = targetName.split(" ")[0] || "Participant";
  const userInitial = user?.name?.[0]?.toUpperCase() || "U";
  const targetInitial = targetFirstName[0]?.toUpperCase() || "P";

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

  // Media Toggle Socket Listener (Sync mute/camera state with remote peer)
  useEffect(() => {
    if (!activeCall) return;
    const socket = getSocket();
    if (!socket) return;

    const handleMediaToggle = (data: { type: "audio" | "video"; enabled: boolean }) => {
      console.log("📡 [ActiveCall] Peer media toggle received:", data);
      if (data.type === "video") {
        setRemoteCameraOff(!data.enabled);
      } else if (data.type === "audio") {
        setRemoteMicMuted(!data.enabled);
      }
    };

    const handleRemoteEnd = (data: any) => {
      console.log("🔴 [ActiveCall] Socket remote end event received:", data);
      handleEndCall();
    };

    socket.on("call:media-toggle", handleMediaToggle);
    socket.on("call:ended", handleRemoteEnd);
    socket.on("call:end", handleRemoteEnd);
    socket.on("webrtc:end", handleRemoteEnd);
    socket.on("call:cancelled", handleRemoteEnd);
    socket.on("call:rejected", handleRemoteEnd);

    return () => {
      socket.off("call:media-toggle", handleMediaToggle);
      socket.off("call:ended", handleRemoteEnd);
      socket.off("call:end", handleRemoteEnd);
      socket.off("webrtc:end", handleRemoteEnd);
      socket.off("call:cancelled", handleRemoteEnd);
      socket.off("call:rejected", handleRemoteEnd);
    };
  }, [activeCall, targetUserId]);

  // LiveKit / WebRTC Media Connection Setup
  useEffect(() => {
    if (!activeCall) return;

    let active = true;

    async function initMediaSession() {
      if (!activeCall) return;
      const callId = activeCall.callId;

      // Acquire local media preview with strict Hardware Echo Cancellation & Noise Suppression
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true },
          },
          video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
        if (!active) {
          localStream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = localStream;
        if (localVideoRef.current && isVideo) {
          localVideoRef.current.muted = true;
          localVideoRef.current.volume = 0;
          const vTracks = localStream.getVideoTracks();
          if (vTracks.length > 0) {
            localVideoRef.current.srcObject = new MediaStream(vTracks);
          }
        }
        console.log(`🎥 [ActiveCall] Local media preview ready — tracks: ${localStream.getTracks().length}`);
      } catch (err) {
        console.warn("⚠️ [ActiveCall] Could not acquire local media preview:", err);
        setStreamError("Microphone or camera permission not granted or device in use.");
      }

      // Option A: LiveKit SFU Connection
      if (livekitUrl && livekitToken) {
        console.log(`🎥 [LiveKit] Connecting to LiveKit Server: ${livekitUrl} (Room: ${displayRoomName})`);
        try {
          const room = new Room({
            adaptiveStream: true,
            dynacast: true,
          });
          livekitRoomRef.current = room;

          const attachTrack = (track: Track, identity?: string, isLocal?: boolean) => {
            console.log(`🎥 [LiveKit] Remote track received: ${track.kind} from ${identity ?? "peer"}`);
            // Strictly prevent attaching local participant tracks to remote audio/video elements (prevents self-voice echo)
            if (isLocal || (identity && (identity === user?.id || identity === room.localParticipant.identity))) {
              console.log("ℹ️ [LiveKit] Ignoring local participant track attachment");
              return;
            }
            if (track.kind === Track.Kind.Video && remoteVideoRef.current && isVideo) {
              remoteVideoRef.current.muted = true;
              remoteVideoRef.current.volume = 0;
              track.attach(remoteVideoRef.current);
              setHasRemoteVideo(true);
              setRemoteCameraOff(false);
            }
            if (track.kind === Track.Kind.Audio && remoteAudioRef.current) {
              remoteAudioRef.current.muted = false;
              track.attach(remoteAudioRef.current);
              remoteAudioRef.current.play().catch((err) => console.warn("LiveKit audio autoplay:", err));
            }
          };

          room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
            attachTrack(track, participant.identity, participant.isLocal);
          });

          room.on(RoomEvent.TrackUnsubscribed, (track, _pub, participant) => {
            console.log(`🎥 [LiveKit] Remote track unsubscribed: ${track.kind}`);
            track.detach();
            if (track.kind === Track.Kind.Video && participant.identity !== user?.id && !participant.isLocal) {
              setHasRemoteVideo(false);
            }
          });

          // Listen for LiveKit Mute/Unmute events so avatar shows instantly when remote user turns off camera
          room.on(RoomEvent.TrackMuted, (pub, participant) => {
            console.log(`🎥 [LiveKit] Track muted: ${pub.kind} from ${participant.identity}`);
            if (pub.kind === Track.Kind.Video && participant.identity !== user?.id && !participant.isLocal) {
              setRemoteCameraOff(true);
            }
            if (pub.kind === Track.Kind.Audio && participant.identity !== user?.id && !participant.isLocal) {
              setRemoteMicMuted(true);
            }
          });

          room.on(RoomEvent.TrackUnmuted, (pub, participant) => {
            console.log(`🎥 [LiveKit] Track unmuted: ${pub.kind} from ${participant.identity}`);
            if (pub.kind === Track.Kind.Video && participant.identity !== user?.id && !participant.isLocal) {
              setRemoteCameraOff(false);
              setHasRemoteVideo(true);
            }
            if (pub.kind === Track.Kind.Audio && participant.identity !== user?.id && !participant.isLocal) {
              setRemoteMicMuted(false);
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
                attachTrack(pub.track, participant.identity, participant.isLocal);
              }
            });
          });

          // Publish local tracks to LiveKit room cleanly
          try {
            const localTracks = await createLocalTracks({
              audio: {
                echoCancellation: { ideal: true },
                noiseSuppression: { ideal: true },
                autoGainControl: { ideal: true },
              },
              video: isVideo ? true : false,
            });

            for (const track of localTracks) {
              if (track.kind === Track.Kind.Video && localVideoRef.current && isVideo) {
                localVideoRef.current.muted = true;
                localVideoRef.current.volume = 0;
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
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } as MediaTrackConstraints,
          video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current && isVideo) {
          localVideoRef.current.muted = true;
          localVideoRef.current.volume = 0;
          const vTracks = stream.getVideoTracks();
          if (vTracks.length > 0) {
            localVideoRef.current.srcObject = new MediaStream(vTracks);
          }
        }

        const pc = new RTCPeerConnection(RTC_CONFIG);
        peerConnectionRef.current = pc;

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        pc.ontrack = (event) => {
          console.log("🎥 [WebRTC] Remote track received:", event.track.kind);
          const [remoteStream] = event.streams;

          if (event.track.kind === "video") {
            if (remoteVideoRef.current && isVideo) {
              remoteVideoRef.current.muted = true;
              remoteVideoRef.current.volume = 0;
              const remoteVTracks = remoteStream ? remoteStream.getVideoTracks() : [event.track];
              remoteVideoRef.current.srcObject = new MediaStream(remoteVTracks);
              setHasRemoteVideo(true);
              setRemoteCameraOff(false);
            }
            event.track.onmute = () => {
              console.log("🎥 [WebRTC] Remote video track muted!");
              setRemoteCameraOff(true);
            };
            event.track.onunmute = () => {
              console.log("🎥 [WebRTC] Remote video track unmuted!");
              setRemoteCameraOff(false);
              setHasRemoteVideo(true);
            };
            event.track.onended = () => {
              setHasRemoteVideo(false);
            };
          }

          if (event.track.kind === "audio") {
            if (remoteAudioRef.current) {
              remoteAudioRef.current.muted = false;
              const remoteATracks = remoteStream ? remoteStream.getAudioTracks() : [event.track];
              remoteAudioRef.current.srcObject = new MediaStream(remoteATracks);
              remoteAudioRef.current.play().catch((err) => console.warn("Audio autoplay blocked:", err));
            }
            event.track.onmute = () => setRemoteMicMuted(true);
            event.track.onunmute = () => setRemoteMicMuted(false);
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

    getSocket()?.emit("call:media-toggle", {
      callId: activeCall.callId,
      targetUserId,
      type: "audio",
      enabled: !newMuted,
    });
    console.log(`` + (newMuted ? "🔇" : "🎙️") + ` [ActiveCall] Mic ${newMuted ? "MUTED" : "UNMUTED"}`);
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

    // When toggled back ON, re-assign srcObject with video tracks ONLY & ensure muted = true
    if (!newOff && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.muted = true;
      localVideoRef.current.volume = 0;
      const vTracks = localStreamRef.current.getVideoTracks();
      if (vTracks.length > 0) {
        localVideoRef.current.srcObject = new MediaStream(vTracks);
      }
    }

    getSocket()?.emit("call:media-toggle", {
      callId: activeCall.callId,
      targetUserId,
      type: "video",
      enabled: !newOff,
    });
    console.log(`` + (newOff ? "🚫" : "📷") + ` [ActiveCall] Camera ${newOff ? "OFF" : "ON"}`);
  };

  const handleEndCall = () => {
    const currentCall = activeCall;
    const callId = currentCall?.callId;
    console.log(`🔴 [ActiveCall] End Call executed — callId: ${callId}, duration: ${duration}s`);

    setIsEnding(true);

    // 1. Instantly dispatch Redux state reset to unmount call modal without delay
    dispatch(callEnded(currentCall ?? undefined));
    dispatch(clearCall());

    // 2. Emit socket notifications to target peer & backend
    try {
      if (callId) {
        const socket = getSocket();
        socket?.emit("call:end", { callId, targetUserId });
        socket?.emit("call:ended", { callId, targetUserId });
        socket?.emit("webrtc:end", { callId, targetUserId });
        callsApi.end(callId).catch((err) => {
          console.warn("⚠️ [ActiveCall] Background REST end call non-fatal warning:", err);
        });
      }
    } catch (err) {
      console.warn("⚠️ [ActiveCall] Socket emit end error:", err);
    }

    // 3. Disconnect LiveKit safely
    try {
      if (livekitRoomRef.current) {
        livekitRoomRef.current.disconnect();
        livekitRoomRef.current = null;
      }
    } catch (err) {
      console.warn("⚠️ [ActiveCall] LiveKit disconnect error:", err);
    }

    // 4. Close WebRTC peer connection safely
    try {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    } catch (err) {
      console.warn("⚠️ [ActiveCall] WebRTC PC close error:", err);
    }

    // 5. Stop local media stream tracks safely
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    } catch (err) {
      console.warn("⚠️ [ActiveCall] Local media tracks stop error:", err);
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
      {/* Hidden Audio element for playing remote participant's voice ONLY */}
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
            backgroundColor: "#050507",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Top Glassmorphic Header Bar Overlay */}
          <div
            style={{
              position: "absolute",
              top: isExpanded ? "20px" : "8px",
              left: isExpanded ? "24px" : "8px",
              right: isExpanded ? "24px" : "8px",
              zIndex: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: isExpanded ? "0.75rem 1.5rem" : "0.35rem 0.6rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(18, 18, 22, 0.85)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#fff",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#10b981",
                  boxShadow: "0 0 10px #10b981",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              {isExpanded && (
                <>
                  <span style={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
                    {isVideo ? `Live Video Call · ${targetFirstName}` : `Voice Call · ${targetFirstName}`}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#a1a1aa", whiteSpace: "nowrap" }}>
                    · 🔒 Encrypted
                  </span>
                </>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: isExpanded ? "0.6rem" : "0.35rem", flexShrink: 0 }}>
              {/* Mute Indicator Pills in Header */}
              {micMuted && (
                <span
                  style={{
                    padding: isExpanded ? "0.25rem 0.75rem" : "0.15rem 0.5rem",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(239, 68, 68, 0.25)",
                    color: "#fca5a5",
                    fontWeight: 700,
                    fontSize: isExpanded ? "0.78rem" : "0.7rem",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {isExpanded ? "🔇 You Muted" : "🔇 You"}
                </span>
              )}

              {remoteMicMuted && (
                <span
                  style={{
                    padding: isExpanded ? "0.25rem 0.75rem" : "0.15rem 0.5rem",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(239, 68, 68, 0.25)",
                    color: "#fca5a5",
                    fontWeight: 700,
                    fontSize: isExpanded ? "0.78rem" : "0.7rem",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {isExpanded ? `🔇 ${targetFirstName} Muted` : `🔇 ${targetFirstName}`}
                </span>
              )}

              <span
                style={{
                  padding: isExpanded ? "0.3rem 0.85rem" : "0.15rem 0.5rem",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(244, 63, 94, 0.2)",
                  color: "#f43f5e",
                  fontWeight: 700,
                  fontSize: isExpanded ? "0.85rem" : "0.72rem",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                ⏱️ {formatTime(duration)}
              </span>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Minimize to Floating Window" : "Expand Fullscreen"}
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#fff",
                  padding: isExpanded ? "0.4rem 0.8rem" : "0.2rem 0.5rem",
                  borderRadius: "9999px",
                  cursor: "pointer",
                  fontSize: isExpanded ? "0.8rem" : "0.72rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "background 0.2s ease",
                }}
              >
                {isExpanded ? "🗗 Floating Window" : "🗖 Fullscreen"}
              </button>
            </div>
          </div>

          {/* Stream Error Alert if any */}
          {streamError && (
            <div
              style={{
                position: "absolute",
                top: isExpanded ? "85px" : "45px",
                zIndex: 31,
                backgroundColor: "rgba(239, 68, 68, 0.25)",
                border: "1px solid #ef4444",
                color: "#fca5a5",
                padding: "0.5rem 1.25rem",
                borderRadius: "9999px",
                fontSize: "0.85rem",
                backdropFilter: "blur(12px)",
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
                muted
                onLoadedMetadata={(e) => {
                  e.currentTarget.muted = true;
                  e.currentTarget.volume = 0;
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: hasRemoteVideo && !remoteCameraOff ? "block" : "none",
                }}
              />

              {/* Remote Participant Avatar Card (Always visible when Remote Camera is Off or Connecting) */}
              {(!hasRemoteVideo || remoteCameraOff) && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "1.25rem",
                    color: "#a1a1aa",
                    zIndex: 20,
                  }}
                >
                  <div
                    style={{
                      width: isExpanded ? "120px" : "65px",
                      height: isExpanded ? "120px" : "65px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, rgba(244, 63, 94, 0.3) 0%, rgba(225, 29, 72, 0.6) 100%)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: isExpanded ? "3.5rem" : "1.9rem",
                      fontWeight: 700,
                      boxShadow: "0 0 50px rgba(244, 63, 94, 0.4)",
                      border: "3px solid rgba(255, 255, 255, 0.2)",
                    }}
                  >
                    {targetInitial}
                  </div>
                  {isExpanded && (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: "1.25rem" }}>
                        {remoteCameraOff ? `${targetFirstName} Turned Camera Off` : `Connecting ${targetFirstName}…`}
                      </div>
                      {remoteMicMuted && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            marginTop: "0.6rem",
                            padding: "0.35rem 1rem",
                            borderRadius: "9999px",
                            backgroundColor: "rgba(239, 68, 68, 0.85)",
                            color: "#fff",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            boxShadow: "0 4px 15px rgba(239, 68, 68, 0.5)",
                          }}
                        >
                          🔇 {targetFirstName} is Muted
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Floating Badge on Main Video if Remote Participant is Muted */}
              {hasRemoteVideo && !remoteCameraOff && remoteMicMuted && (
                <div
                  style={{
                    position: "absolute",
                    top: isExpanded ? "85px" : "45px",
                    left: isExpanded ? "28px" : "14px",
                    zIndex: 26,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.4rem 0.9rem",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(239, 68, 68, 0.9)",
                    color: "#fff",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <span>🔇</span>
                  <span>{targetFirstName} is Muted</span>
                </div>
              )}

              {/* Picture-in-Picture Local Video Camera Preview */}
              <div
                style={{
                  position: "absolute",
                  bottom: isExpanded ? "110px" : "14px",
                  right: isExpanded ? "28px" : "14px",
                  width: isExpanded ? "220px" : "90px",
                  height: isExpanded ? "150px" : "60px",
                  backgroundColor: "#18181b",
                  borderRadius: "1.25rem",
                  overflow: "hidden",
                  border: "2px solid rgba(244, 63, 94, 0.6)",
                  boxShadow: "0 15px 35px rgba(0, 0, 0, 0.8)",
                  zIndex: 25,
                  transition: "all 0.3s ease",
                }}
              >
                {/* Local Mute Indicator Badge */}
                {micMuted && (
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      left: "8px",
                      zIndex: 26,
                      backgroundColor: "rgba(239, 68, 68, 0.9)",
                      color: "#fff",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      padding: "0.15rem 0.45rem",
                      borderRadius: "9999px",
                      backdropFilter: "blur(4px)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <span>🔇 Muted</span>
                  </div>
                )}

                {/* Always keep video element mounted in DOM to retain stream on toggle */}
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={(e) => {
                    e.currentTarget.muted = true;
                    e.currentTarget.volume = 0;
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "scaleX(-1)",
                    display: cameraOff ? "none" : "block",
                  }}
                />

                {cameraOff && (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
                      color: "#a1a1aa",
                      gap: "0.25rem",
                    }}
                  >
                    <div
                      style={{
                        width: isExpanded ? "44px" : "28px",
                        height: isExpanded ? "44px" : "28px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(244, 63, 94, 0.2)",
                        color: "#f43f5e",
                        fontWeight: 700,
                        fontSize: isExpanded ? "1.1rem" : "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid rgba(244, 63, 94, 0.4)",
                      }}
                    >
                      {userInitial}
                    </div>
                    <span style={{ fontSize: "0.65rem", color: "#a1a1aa", fontWeight: 600 }}>Cam Off</span>
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
                  width: isExpanded ? "120px" : "60px",
                  height: isExpanded ? "120px" : "60px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isExpanded ? "3.5rem" : "1.8rem",
                  boxShadow: "0 0 40px rgba(16, 185, 129, 0.3)",
                }}
              >
                🎙️
              </div>
              {isExpanded && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff" }}>
                    Voice Call with {targetFirstName}
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#a1a1aa", marginTop: "0.35rem" }}>
                    Crystal-clear encrypted audio stream active
                  </div>
                  {remoteMicMuted && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        marginTop: "0.85rem",
                        padding: "0.4rem 1.1rem",
                        borderRadius: "9999px",
                        backgroundColor: "rgba(239, 68, 68, 0.85)",
                        color: "#fff",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)",
                      }}
                    >
                      <span>🔇 {targetFirstName} is Muted</span>
                    </div>
                  )}
                  {micMuted && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        marginTop: "0.5rem",
                        padding: "0.35rem 0.9rem",
                        borderRadius: "9999px",
                        backgroundColor: "rgba(239, 68, 68, 0.25)",
                        color: "#ef4444",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        border: "1px solid rgba(239, 68, 68, 0.4)",
                      }}
                    >
                      <span>🔇 You are Muted</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bottom Floating Glassmorphic Controls Bar */}
          <div
            style={{
              position: "absolute",
              bottom: isExpanded ? "28px" : "10px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 30,
              display: "flex",
              alignItems: "center",
              gap: isExpanded ? "1.25rem" : "0.5rem",
              padding: isExpanded ? "0.85rem 2rem" : "0.35rem 0.85rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(18, 18, 22, 0.85)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
            }}
          >
            {/* Mute Mic Button */}
            <button
              type="button"
              onClick={toggleMic}
              title={micMuted ? "Unmute Microphone" : "Mute Microphone"}
              style={{
                width: isExpanded ? "52px" : "36px",
                height: isExpanded ? "52px" : "36px",
                borderRadius: "50%",
                border: "none",
                backgroundColor: micMuted ? "#ef4444" : "rgba(255, 255, 255, 0.15)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isExpanded ? "1.35rem" : "1rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {micMuted ? <MicOffIcon size={isExpanded ? 22 : 16} /> : <MicIcon size={isExpanded ? 22 : 16} />}
            </button>

            {/* Toggle Camera Button */}
            {isVideo && (
              <button
                type="button"
                onClick={toggleCamera}
                title={cameraOff ? "Turn Camera On" : "Turn Camera Off"}
                style={{
                  width: isExpanded ? "52px" : "36px",
                  height: isExpanded ? "52px" : "36px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: cameraOff ? "#ef4444" : "rgba(255, 255, 255, 0.15)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isExpanded ? "1.35rem" : "1rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {cameraOff ? <VideoOffIcon size={isExpanded ? 22 : 16} /> : <VideoIcon size={isExpanded ? 22 : 16} />}
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
              <PhoneEndIcon size={isExpanded ? 20 : 16} />
              {isExpanded && <span>{isEnding ? "Ending..." : "End Call"}</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
