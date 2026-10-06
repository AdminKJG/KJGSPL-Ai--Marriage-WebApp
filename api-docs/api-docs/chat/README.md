# Messaging & Realtime Chat Module — API Documentation

## 📍 Base URLs
- **REST Endpoints:** `http://localhost:8000/v1/messages`
- **Realtime WebSocket Server:** `ws://localhost:8000` (Socket.IO)

---

## 🎯 Overview & Business Logic

The Messaging module provides real-time 1-on-1 private conversations between mutually connected matrimonial members. It combines REST history endpoints with a persistent Socket.IO layer for instant message broadcasting and push notifications.

### Core Rules & Mechanics:
1. **Active Mutual Connection Required:** Messaging is restricted strictly to members who share an active mutual match. Accessing threads with non-matched members returns `403 Forbidden`.
2. **Call Integration:** Call status entries (missed, answered, declined) appear directly in the conversation feed with `type: "CALL"` and `metadata: { kind, status, durationSec }`.
3. **Practice Identity Replies:** Enabled fictional bots can send scripted practice replies when the member has opted in (`settings.practiceInteractions: true`). All automated messages have `automated: true`.
4. **Message Constraints:** Text content is validated (1 to 2000 characters), sanitized, and persisted to PostgreSQL before broadcasting.

---

## 🌐 WebSocket (Socket.IO) Protocol

### 1. Connection & Handshake Authentication
Clients connect to the root namespace with the JWT Access Token in `handshake.auth.token` or `handshake.headers.authorization`:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:8000', {
  auth: {
    token: accessToken // or 'Bearer ' + accessToken
  },
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Connected to realtime chat server');
});
```

### 2. Client → Server Socket Events

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `join_room` | `{ "conversationId": "string" }` | Joins the 1-on-1 conversation room after verifying double consent and mutual match. |
| `leave_room` | `{ "conversationId": "string" }` | Leaves the active conversation room. |
| `send_message` | `{ "conversationId": "string", "content": "string" }` | Sends a chat message (1–2000 characters). Automatically persists to DB, broadcasts to room, and queues push notification. |

### 3. Server → Client Socket Events

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `message_received` | `{ "id": "string", "conversationId": "string", "senderId": "string", "content": "string", "createdAt": "ISO string" }` | Broadcast to all clients in the conversation room upon successful message delivery. |
| `error` | `{ "message": "string" }` | Emitted when validation or authentication fails on socket actions. |

---

## 📊 REST Endpoints Detail

### 1. List All Active Conversation Threads
**`GET /v1/messages`**

- **Full URL:** `http://localhost:8000/v1/messages`
- **Auth Guard:** Bearer Access Token (`member`)

#### Response (`200 OK`)
```json
{
  "items": [
    {
      "id": "cmu54acrr00manzks6oded6v4",
      "profileId": "cmu54acrr00manzks6oded6v4",
      "profile": {
        "id": "cmu54acrr00manzks6oded6v4",
        "name": "Ananya Sharma",
        "age": 27,
        "city": "Mumbai",
        "gender": "woman",
        "occupation": "Senior Architect",
        "education": "Master of Architecture",
        "bio": "Passionate about sustainable architecture and sketching.",
        "interests": ["interest_architecture", "interest_art"],
        "values": ["creativity", "family"],
        "lifestyle": ["early_riser"],
        "futurePlans": "",
        "prompts": [],
        "languages": ["English", "Hindi"],
        "intention": "A lasting relationship, open to marriage",
        "visibility": "visible",
        "fictional": false,
        "automated": false,
        "identityLabel": null,
        "cultural": {},
        "image": null,
        "photos": [{ "id": "cmu54acrs00nwnzksul2hge88" }],
        "publicStoryAnswers": [],
        "sampleStoryTranscripts": {},
        "alignment": null
      },
      "lastMessage": "Looking forward to our coffee conversation on Saturday!"
    }
  ]
}
```

---

### 2. Get Message History for Connection
**`GET /v1/messages/:profileId`**

- **Full URL:** `http://localhost:8000/v1/messages/:profileId`
- **Auth Guard:** Bearer Access Token (`member`)

#### Response (`200 OK`)
```json
{
  "items": [
    {
      "id": "cm8msg001abc",
      "text": "Hello Ananya! Loved reading your weekend story about architecture.",
      "from": "me",
      "createdAt": "2026-10-02T10:00:00.000Z",
      "automated": false,
      "type": "TEXT",
      "callId": null,
      "metadata": null
    },
    {
      "id": "cm8msg002xyz",
      "text": "Hi Rohan! Thank you, I really enjoyed your coffee roasting notes.",
      "from": "cmu54acrr00manzks6oded6v4",
      "createdAt": "2026-10-02T10:05:00.000Z",
      "automated": false,
      "type": "TEXT",
      "callId": null,
      "metadata": null
    },
    {
      "id": "cm8msg003call",
      "text": "Audio call · 5m 20s",
      "from": "me",
      "createdAt": "2026-10-02T10:30:00.000Z",
      "automated": false,
      "type": "CALL",
      "callId": "call_123456789",
      "metadata": {
        "kind": "AUDIO",
        "status": "ENDED",
        "durationSec": 320
      }
    }
  ],
  "profile": {
    "id": "cmu54acrr00manzks6oded6v4",
    "name": "Ananya Sharma",
    "age": 27,
    "city": "Mumbai"
  },
  "icebreakers": [
    "What does a good ordinary day together look like to you?"
  ],
  "hasMore": false
}
```

---

### 3. Send Message via REST
**`POST /v1/messages/:profileId`**

- **Full URL:** `http://localhost:8000/v1/messages/:profileId`
- **Auth Guard:** Bearer Access Token (`member`)

#### Request Body
```json
{
  "text": "Would you like to connect for tea sometime this weekend?"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `text` | String | Yes | Message text (1 to 2000 characters, trimmed). |

#### Response (`201 Created`)
```json
{
  "id": "cm8msg004new",
  "text": "Would you like to connect for tea sometime this weekend?",
  "from": "me",
  "createdAt": "2026-10-02T11:00:00.000Z",
  "status": "stored",
  "delivered": false
}
```

---

*Maintained by AI Marriage Engineering Team.*
