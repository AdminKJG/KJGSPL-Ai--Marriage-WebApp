# User Blocking Module — API Documentation

## 📍 Base URL
- **Primary Mobile / Web Prefix:** `http://localhost:8000/v1`
- **Legacy REST Prefix (when enabled):** `http://localhost:8000/api/block`

---

## 🎯 Overview & Business Logic

The Blocking module allows members to immediately sever all visibility, contact, discovery exposure, and mutual connections with specific users (`POST /v1/profiles/:id/block` and `POST /v1/profiles/:id/unblock`).

### Security Guarantees:
1. **Instant Bidirectional Redaction:** Once User A blocks User B, neither user can view the other in discovery feeds, search, or connection lists.
2. **Match Termination:** Any existing mutual match is immediately revoked and deleted from the database.
3. **Chat Inaccessibility:** Active conversations between both parties are permanently hidden and disabled.
4. **Calling Protection:** Attempting to place a call to or receive a call from a blocked member is immediately rejected.

---

## 📊 Endpoints Detail

### 1. Block User
**`POST /v1/profiles/:id/block`**

- **Full URL:** `http://localhost:8000/v1/profiles/:id/block` (where `:id` is the target member's user ID)
- **Auth Guard:** Bearer Access Token (`member`)

#### Response (`200 OK`)
```json
{
  "blocked": true,
  "mutual": false,
  "chatAvailable": false
}
```

---

### 2. Unblock User
**`POST /v1/profiles/:id/unblock`**

- **Full URL:** `http://localhost:8000/v1/profiles/:id/unblock` (where `:id` is the target member's user ID)
- **Auth Guard:** Bearer Access Token (`member`)

#### Response (`200 OK`)
```json
{
  "blocked": false
}
```

---

### 3. Retrieve Blocked Members List
**`GET /v1/me`**

Calling `GET /v1/me` returns the current user's active blocklist:
- `blocked`: Array of blocked user ID strings (e.g. `["cmu54blocked001", "cmu54blocked002"]`).
- `blockedProfiles`: Array of blocked user objects (e.g. `[{ "id": "cmu54blocked001", "name": "Blocked Member", "city": "", "age": 18 }]`).

---

## 🛠️ Legacy Block Endpoints (`/api/block/*`)

*When `ENABLE_LEGACY_API=true` is enabled:*

- `POST /api/block`: Blocks a user with request body `{ "blockedId": "string" }`.
- `DELETE /api/block/:blockedId`: Unblocks the specified user ID.
- `GET /api/block`: Returns array of all blocked users.

---

*Maintained by AI Marriage Engineering Team.*
