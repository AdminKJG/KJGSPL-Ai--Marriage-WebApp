# AI Marriage Backend — Comprehensive API Documentation (`api-docs`)

Welcome to the official, production-ready API documentation for the **AI Marriage Backend** platform. This directory contains detailed specifications, exact schemas, request/response payloads, authentication rules, rate limits, WebSocket protocols, and integration guidance for frontend (Web & Flutter/Mobile) developers.

---

## 🌐 Global Architecture & Base URLs

- **Primary API Prefix (Mobile & Web v1):** `/v1` (e.g. `http://localhost:8000/v1/auth/login`)
- **Local Development Base URL:** `http://localhost:8000`
- **Development Tunnel Base URL:** `https://<dev-tunnel-host>`
- **Root Service Status:** `GET http://localhost:8000/`
- **System Health Check:** `GET http://localhost:8000/health`
- **Contract Health Check:** `GET http://localhost:8000/v1/health`
- **WebSocket / Realtime Endpoint:** `ws://localhost:8000` (Socket.IO namespace: `/`)
- **Legacy REST API Prefix (when enabled via `ENABLE_LEGACY_API=true`):** `/api`

---

## 🔒 Authentication & Session Management

1. **JWT Bearer Token Authentication:**
   - Protected `/v1` endpoints require an `Authorization` HTTP Header:
     ```http
     Authorization: Bearer <accessToken>
     ```
   - Access tokens are short-lived JSON Web Tokens (15 minutes TTL) containing `sub` (userId), `sid` (sessionId), and `kind: "access"`.

2. **Single-Use Refresh Token Rotation:**
   - Refresh tokens (30-day TTL) are issued upon login and session refresh.
   - Calling `POST /v1/auth/refresh` performs **cryptographic single-use rotation**.
   - **Replay Protection:** Submitting an already-used refresh token immediately revokes the entire session family to protect against token theft.

3. **Multi-Factor Authentication (MFA / TOTP):**
   - When MFA is enabled on a member account (`mfaEnabled: true`), `POST /v1/auth/login` requires a 6-digit TOTP `mfaCode`.

4. **Role & Entitlement Hierarchy:**
   - **`member`** (`usertype: "user"`): Standard matrimonial member. Access to profile, candidate discovery feed, compatibility matching, story answers, mutual chat, calling, media gallery, and billing.
   - **`operations_admin`** (`usertype: "admin"`): Operational management, safety reports triage, photo moderation review, read-only masters, and matching simulator.
   - **`moderator`** (`usertype: "moderator"`): Safety case resolution and photograph review.
   - **`super_admin`** (`usertype: "superadmin"`): Full platform governance, master configuration publishing/rollback, member suspension/reinstatement, and practice bot automation controls.

---

## ⚡ Global Error Response Format

All error responses from the `/v1` API adhere to a standardized JSON error envelope:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request parameters."
  }
}
```

### Standard HTTP Status Codes & Error Codes
| Status Code | Error Code | Description |
| :--- | :--- | :--- |
| `200 OK` | — | Request succeeded. |
| `201 Created` | — | Resource created successfully. |
| `400 Bad Request` | `BAD_REQUEST`, `VALIDATION_ERROR` | Schema validation failed or illegal operation requested. |
| `401 Unauthorized` | `UNAUTHORIZED` | Missing, invalid, or expired session token. |
| `403 Forbidden` | `FORBIDDEN` | Insufficient role permissions or missing mutual connection. |
| `404 Not Found` | `NOT_FOUND` | Target resource or profile does not exist. |
| `409 Conflict` | `CONFLICT` | Unique key collision, concurrent call collision, or stale revision/questionnaire version. |
| `422 Unprocessable`| `UNPROCESSABLE_ENTITY` | Audio file does not match required 16kHz mono WAV format. |
| `429 Too Many Req` | `RATE_LIMITED`, `SERVICE_BUSY` | Rate limit exceeded or AI microservice capacity reached. |
| `503 Unavailable` | `SERVICE_UNAVAILABLE`, `STORAGE_DISABLED`, `SETUP_REQUIRED` | Downstream service unavailable or photo storage not configured. |

---

## 🛑 Rate Limiting Policies

- **Auth Endpoints (`/v1/auth/*`):** 30 requests per 15-minute window per IP (with a 15-minute temporary lockout after 5 consecutive failed credential attempts).
- **Authenticated Endpoints (`/v1/*`):** 240 requests per 60-second window per IP.
- **Legacy API Endpoints:** Standard limiter (100 req / 15 min) and strict limiter (10 req / 15 min).

---

## 📂 Complete Module Sitemap

| Documentation File | Route Prefix / Endpoint | Primary Responsibilities |
| :--- | :--- | :--- |
| [`/health`](./health/README.md) | `GET /`, `GET /health`, `GET /v1/health` | System liveness probe, process uptime, and database connectivity. |
| [`/auth`](./auth/README.md) | `POST /v1/auth/*`, `GET /v1/auth/session` | Registration, login with TOTP MFA, refresh token rotation, logout, and session check. |
| [`/profile`](./profile/README.md) | `GET/PATCH/DELETE /v1/me`, `GET /v1/profiles/:id`, `POST /v1/profiles/:id/*` | Own profile, partner preferences, cultural settings, public profile view, and actions. |
| [`/discovery`](./discovery/README.md) | `GET /v1/discovery` | Compatibility-ranked candidate feed, multi-attribute filtering, and daily 10-profile quota tracking. |
| [`/matching`](./matching/README.md) | `GET /v1/profiles/:id/compatibility` | 5-category deterministic scoring, eligibility check (`PASS`/`FAIL`), reasons, and difference breakdown. |
| [`/interest`](./interest/README.md) | `POST /v1/interest`, `POST /v1/unmatch`, `GET /v1/connections` | Send interest, unmatch, and retrieve connection groups (`saved`, `sent`, `received`, `mutual`). |
| [`/chat`](./chat/README.md) | `GET /v1/messages`, `GET/POST /v1/messages/:id`, Socket.IO | Mutual connection messaging, conversation history, automated bot practice replies, and Socket.IO events. |
| [`/calling`](./calling/README.md) | `POST /v1/calls/*`, `GET /v1/calls/*`, LiveKit & Socket.IO | 1:1 LiveKit audio/video calling, scoped JWT room tokens, ring timeout, and call message bubbles. |
| [`/questionnaire`](./questionnaire/README.md) | `GET /v1/story`, `PUT/DELETE /v1/story/answers/*`, `PUT /v1/story/plans/*` | Multi-round story answers, question chapters, transcript sharing, and mutual date planning proposals. |
| [`/ai`](./ai/README.md) | `POST /v1/assist`, `POST /v1/voice/transcribe` | AI bio draft generator, icebreakers, date ideas, clarification, and faster-whisper speech transcription. |
| [`/safety`](./safety/README.md) | `POST /v1/profiles/:id/report`, `POST /api/safety/report` | User safety reporting with categorization (`HARASSMENT`, `SCAM`, `INAPPROPRIATE_PROFILE`, `OTHER`). |
| [`/block`](./block/README.md) | `POST /v1/profiles/:id/block`, `POST /v1/profiles/:id/unblock` | Immediate bidirectional blocking, match termination, and chat redaction. |
| [`/media`](./media/README.md) | `POST /v1/media/photos`, `GET /v1/media/gallery`, `PATCH /v1/media/photos/:id/main`, `PUT /v1/media/photos/reorder` | Base64 photo upload, Sharp EXIF stripping, 1600x1600 resizing, gallery reordering, and moderation. |
| [`/payment`](./payment/README.md) | `GET/POST /v1/billing/*`, `GET/PATCH /v1/account-centre/*` | Razorpay order creation, payment verification, subscription management, boost actions, and policy consent. |
| [`/events`](./events/README.md) | `GET /v1/events`, `POST /v1/events/:id/save` | Social mixers, cultural matrimonial events, city filtering, and event bookmarking. |
| [`/notification`](./notification/README.md) | `GET/PATCH/DELETE /v1/notifications/*`, `PATCH /v1/account-centre/preferences` | In-app notification inbox, unread counts, mark-all-as-read, delete, and communication preferences. |
| [`/configuration`](./configuration/README.md) | `GET /v1/config`, `GET /v1/public/platform` | Client configuration, master lists (geography, scoring, rules), cultural fields, and capabilities. |
| [`/admin`](./admin/README.md) | `GET/POST/PATCH /v1/admin/*` | Dashboard KPIs, member lifecycle, report resolution, audit logs, simulator, and bot automation. |

---

*Maintained by AI Marriage Engineering Team — Version 1.0.0 (Production Verified).*
