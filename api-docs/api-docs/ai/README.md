# AI Assistant & Speech Transcription Module — API Documentation

## 📍 Base URL
- **Primary Mobile / Web Prefix:** `http://localhost:8000/v1`
- **Legacy REST Prefix (when enabled):** `http://localhost:8000/api/ai`

---

## 🎯 Overview & Business Logic

The AI Assistant module provides members with deterministic and model-assisted features to generate matrimonial bio drafts, respectful conversation icebreakers, first date ideas, questionnaire clarification suggestions, and on-device voice transcription (`faster-whisper` ASR microservice).

### Core Policies:
1. **Advisory Assistance Only:** AI suggestions are advisory and never automatically modify a profile, send messages, or overwrite answers without explicit user confirmation.
2. **Audio Privacy & On-Device Control:** Raw audio recordings remain private on the member's client device. Transcriptions are generated on-the-fly and only reviewed narrative text is retained.
3. **Local & External Fallbacks:** If the AI microservice is busy or unreachable, deterministic offline fallback templates and clarification choices respond immediately.

---

## 📊 Endpoints Detail

### 1. Request AI Profile / Conversation Assistance
**`POST /v1/assist`**

- **Full URL:** `http://localhost:8000/v1/assist`
- **Auth Guard:** Bearer Access Token (`member`)
- **Quota / Rate Limit:** Max 3 requests per member per UTC day (when local model enabled).

#### Request Body
```json
{
  "kind": "bio",
  "text": "I am a product engineer who loves classical music, coffee roasting, and family dinners.",
  "questionId": "weekend",
  "allowLocalModel": false,
  "complexInput": false
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `kind` | String | Yes | Assistance mode: `"bio"`, `"icebreaker"`, `"date"`, or `"clarify"`. |
| `text` | String | Yes | Starting draft, keywords, or background notes (max 2000 characters). |
| `questionId` | String | No | Relevant question ID (used when `kind === "clarify"`). |
| `allowLocalModel` | Boolean | No | Permit local bounded model inference (default `false`). |
| `complexInput` | Boolean | No | Pass `true` for detailed long-form prompts (default `false`). |

#### Response (`200 OK — Bio Generation`)
```json
{
  "choices": [
    {
      "text": "Creative product engineer in Mumbai with a passion for classical music, specialty coffee roasting, and meaningful family traditions. Looking for an understanding partner who values mutual growth and authentic connection.",
      "tone": "Warm & Balanced"
    }
  ],
  "suggestions": [
    "Highlight your favourite weekend morning rituals",
    "Mention your long-term city settlement preferences"
  ],
  "modelCalled": false
}
```

#### Response (`200 OK — Icebreaker Suggestions`)
```json
{
  "choices": [],
  "suggestions": [
    "I noticed you love hiking and sketching! What has been your favourite trail so far?",
    "What kind of books or music have inspired you recently?",
    "What does your ideal Saturday morning look like?"
  ],
  "modelCalled": false
}
```

---

### 2. Speech-to-Text Voice Transcription
**`POST /v1/voice/transcribe`**

- **Full URL:** `http://localhost:8000/v1/voice/transcribe`
- **Auth Guard:** Bearer Access Token (`member`)
- **Payload Format:** Base64-encoded PCM16 16kHz mono WAV audio.
- **Engine:** Python `faster-whisper-tiny` ASR microservice.

#### Request Body
```json
{
  "audio": "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA...",
  "language": "en",
  "product": "ai-marriage"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `audio` | String | Yes | Base64-encoded 16kHz mono WAV audio string. |
| `language` | String | No | Target spoken language code (e.g. `"en"`, `"hi"`). Pass `null` for auto-detection. |
| `product` | String | No | Target product identifier (default: `"ai-marriage"`). |

#### Response (`200 OK`)
```json
{
  "text": "I really enjoy exploring quiet trails and finding local specialty coffee roasters on Saturday mornings.",
  "language": "en",
  "duration": 4.25,
  "modelRevision": "faster-whisper-tiny-v1"
}
```

#### Error Responses
- `400 Bad Request`: Missing `audio` payload.
- `422 Unprocessable Entity`: Audio payload is not valid 16kHz mono WAV or no clear human speech was detected.
- `429 Too Many Requests` (`SERVICE_BUSY`): Transcription service is under peak concurrency load; retry in 1.8s.
- `503 Service Unavailable`: Downstream Python ASR microservice is currently unreachable.

---

## 🛠️ Legacy / Extended AI Endpoints (`/api/ai/*`)

*When `ENABLE_LEGACY_API=true` is enabled:*

- `POST /api/ai/profile/draft`: Generates bio draft from structured profile data.
- `POST /api/ai/matching/explain`: Returns plain-English compatibility explanation.
- `POST /api/ai/conversation/suggestions`: Generates chat starters based on candidate profile.
- `POST /api/ai/safety/classify`: Moderation classifier for user messages.
- `POST /api/ai/voice/transcribe`: Speech transcription endpoint.

---

*Maintained by AI Marriage Engineering Team.*
