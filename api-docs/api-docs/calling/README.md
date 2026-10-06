# Calling Module (LiveKit 1:1 Audio & Video) — API Documentation

## 📍 Base URL
- **Mobile / Web Active Contract:** `http://localhost:8000/v1/calls`
- **Realtime WebSocket Server:** `ws://localhost:8000` (Socket.IO)

---

## 🎯 Overview & Architecture

The Calling module provides secure, low-latency 1-on-1 audio and video calling between mutually matched matrimonial members. The Node.js backend handles session authorization, token issuance, ringing lifecycle, timeout sweeps, and chat logging; media streams (audio & video) travel directly via LiveKit.

### Core Guarantees:
1. **Double-Consent Mutual Match Gate:** Calls require an active mutual match with no blocking in either direction.
2. **Foreground-Only Ringing:** Calls ring while clients are connected in the foreground. A callee who is offline or backgrounded experiences a missed call after the **30-second ring timeout**.
3. **Scoped LiveKit JWT Tokens:** Tokens are issued strictly per-user and per-room with a 15-minute TTL.
   - For `kind: "AUDIO"`, camera publish permissions are withheld.
   - For `kind: "VIDEO"`, both microphone and camera permissions are granted.
4. **Token Issuance Timing:** The caller receives a token immediately to pre-warm the room; the callee receives a token **only upon answering** (`call:accepted` / `POST /v1/calls/:id/accept`).
5. **Durable Chat Entries:** Starting a call inserts a message of `type: "CALL"` in the conversation. When the call ends, declines, or times out, the message text and metadata are updated in-place with the final status and duration.

---

## 📊 Enums & State Machine

| Enum | Values | Description |
| :--- | :--- | :--- |
| `CallKind` | `AUDIO`, `VIDEO` | Media streams enabled for the call. |
| `CallStatus` | `RINGING`, `ACCEPTED`, `REJECTED`, `MISSED`, `CANCELED`, `ENDED`, `FAILED` | Call session state machine. |
| `MessageType` | `TEXT`, `CALL`, `SYSTEM` | Conversation message type. |

### Lifecycle Flow:
```
                      ┌──────────► REJECTED   (Callee declined)
                      │
   Initiate ──► RINGING ┼──────────► CANCELED  (Caller cancelled while ringing)
                      │
                      ├──► ACCEPTED ──► ENDED  (Hangup, or room closed)
                      │
                      ├──► MISSED     (30s ring timeout expired)
                      └──► FAILED
```

---

## 🌐 Socket.IO Realtime Call Events

The backend automatically joins authenticated clients to their private room (`user:<userId>`).

### Client → Server Events
| Event | Payload | Description |
| :--- | :--- | :--- |
| `call:ring` | `{ "targetUserId": "string", "kind": "AUDIO" \| "VIDEO" }` | Initiates a call to target member. Returns `call:token` to caller. |
| `call:accept` | `{ "callId": "string" }` | Callee answers ringing call. Emits `call:accepted` with LiveKit tokens to both users. |
| `call:reject` | `{ "callId": "string" }` | Callee declines ringing call. Emits `call:rejected` to both users. |
| `call:end` | `{ "callId": "string" }` | Either participant ends an active call or cancels a ringing call. Emits `call:ended`. |

### Server → Client Events
| Event | Payload | Description |
| :--- | :--- | :--- |
| `call:incoming` | Call Object + `from: string` | Emitted to callee when a call is ringing. *(No token included yet)*. |
| `call:token` | Call Object + `{ url, roomName, token }` | Emitted as immediate reply to caller upon initiating, or to callee upon accepting. |
| `call:accepted` | Call Object + `{ url, roomName, token }` | Emitted to both participants once answered. |
| `call:rejected` | Call Object | Emitted to both participants when callee declines. |
| `call:ended` | Call Object | Emitted to both participants when call ends or caller cancels. |
| `call:missed` | Call Object | Emitted when 30s ring timeout expires without an answer. |

---

## 📊 REST Endpoints Detail

### 1. Initiate Call
**`POST /v1/calls`**

- **Full URL:** `http://localhost:8000/v1/calls`
- **Auth Guard:** Bearer Access Token (`member`)

#### Request Body
```json
{
  "targetUserId": "cmu54acrr00manzks6oded6v4",
  "kind": "VIDEO"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `targetUserId` | String | Yes | ID of mutual connection to call. |
| `kind` | String | Yes | `"AUDIO"` or `"VIDEO"`. |

#### Response (`201 Created — Caller Credentials`)
```json
{
  "call": {
    "callId": "cm8call001xyz",
    "conversationId": "cm8conv123",
    "callerId": "cmu549khj001znzksahfvcjqp",
    "calleeId": "cmu54acrr00manzks6oded6v4",
    "kind": "VIDEO",
    "status": "RINGING",
    "startedAt": null,
    "answeredAt": null,
    "endedAt": null,
    "durationSec": null,
    "url": "wss://livekit.example.com",
    "roomName": "call_3f2a9c10-...",
    "token": "eyJhbGciOi..."
  }
}
```

---

### 2. Accept Incoming Call
**`POST /v1/calls/:callId/accept`**

- **Full URL:** `http://localhost:8000/v1/calls/:callId/accept`
- **Auth Guard:** Bearer Access Token (Callee only)

#### Response (`200 OK — Callee Credentials`)
```json
{
  "call": {
    "callId": "cm8call001xyz",
    "conversationId": "cm8conv123",
    "callerId": "cmu549khj001znzksahfvcjqp",
    "calleeId": "cmu54acrr00manzks6oded6v4",
    "kind": "VIDEO",
    "status": "ACCEPTED",
    "startedAt": "2026-10-02T12:00:05.000Z",
    "answeredAt": "2026-10-02T12:00:05.000Z",
    "endedAt": null,
    "durationSec": null,
    "url": "wss://livekit.example.com",
    "roomName": "call_3f2a9c10-...",
    "token": "eyJhbGciOi..."
  }
}
```

---

### 3. Decline Call
**`POST /v1/calls/:callId/decline`**

- **Full URL:** `http://localhost:8000/v1/calls/:callId/decline`
- **Auth Guard:** Bearer Access Token (Callee only)

#### Response (`200 OK`)
```json
{
  "call": {
    "callId": "cm8call001xyz",
    "conversationId": "cm8conv123",
    "callerId": "cmu549khj001znzksahfvcjqp",
    "calleeId": "cmu54acrr00manzks6oded6v4",
    "kind": "VIDEO",
    "status": "REJECTED",
    "startedAt": null,
    "answeredAt": null,
    "endedAt": "2026-10-02T12:00:10.000Z",
    "durationSec": null
  }
}
```

---

### 4. End / Cancel Call
**`POST /v1/calls/:callId/end`**

- **Full URL:** `http://localhost:8000/v1/calls/:callId/end`
- **Auth Guard:** Bearer Access Token (Caller or Callee)

#### Response (`200 OK`)
```json
{
  "call": {
    "callId": "cm8call001xyz",
    "conversationId": "cm8conv123",
    "callerId": "cmu549khj001znzksahfvcjqp",
    "calleeId": "cmu54acrr00manzks6oded6v4",
    "kind": "VIDEO",
    "status": "ENDED",
    "startedAt": "2026-10-02T12:00:05.000Z",
    "answeredAt": "2026-10-02T12:00:05.000Z",
    "endedAt": "2026-10-02T12:05:25.000Z",
    "durationSec": 320
  }
}
```

---

### 5. Get Call Details
**`GET /v1/calls/:callId`**

- **Full URL:** `http://localhost:8000/v1/calls/:callId`
- **Auth Guard:** Bearer Access Token (Participant)

#### Response (`200 OK`)
```json
{
  "call": {
    "callId": "cm8call001xyz",
    "conversationId": "cm8conv123",
    "callerId": "cmu549khj001znzksahfvcjqp",
    "calleeId": "cmu54acrr00manzks6oded6v4",
    "kind": "VIDEO",
    "status": "ENDED",
    "startedAt": "2026-10-02T12:00:05.000Z",
    "answeredAt": "2026-10-02T12:00:05.000Z",
    "endedAt": "2026-10-02T12:05:25.000Z",
    "durationSec": 320
  }
}
```

---

### 6. Get Latest Call for Conversation
**`GET /v1/calls/conversation/:conversationId/latest`**

- **Full URL:** `http://localhost:8000/v1/calls/conversation/:conversationId/latest`
- **Auth Guard:** Bearer Access Token (Participant)

#### Response (`200 OK`)
```json
{
  "call": {
    "callId": "cm8call001xyz",
    "conversationId": "cm8conv123",
    "callerId": "cmu549khj001znzksahfvcjqp",
    "calleeId": "cmu54acrr00manzks6oded6v4",
    "kind": "VIDEO",
    "status": "ENDED",
    "startedAt": "2026-10-02T12:00:05.000Z",
    "answeredAt": "2026-10-02T12:00:05.000Z",
    "endedAt": "2026-10-02T12:05:25.000Z",
    "durationSec": 320
  }
}
```

---

*Maintained by AI Marriage Engineering Team.*
