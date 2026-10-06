# Safety & Reporting Module — API Documentation

## 📍 Base URL
- **Primary Mobile / Web Prefix:** `http://localhost:8000/v1`
- **Legacy REST Prefix (when enabled):** `http://localhost:8000/api/safety`

---

## 🎯 Overview & Business Logic

The Safety & Reporting module enables members to submit confidential reports regarding suspicious activity, harassment, solicitation, inappropriate profile media, or impersonation (`POST /v1/profiles/:id/report`).

### Core Safety Guarantees:
1. **Strict Confidentiality:** The reported user is never notified of who submitted the safety report.
2. **Human Moderation Queue:** Safety reports are logged into the admin safety triage queue (`/v1/admin/reports`) for human investigator review.
3. **Evidence Audit Retention:** When accounts are deleted or modified, safety incident descriptions and audit timestamps are redacted and retained to satisfy legal compliance.

---

## 📊 Endpoints Detail

### 1. File Safety Report
**`POST /v1/profiles/:id/report`**

- **Full URL:** `http://localhost:8000/v1/profiles/:id/report` (where `:id` is the reported member's user ID)
- **Auth Guard:** Bearer Access Token (`member`)

#### Request Body
```json
{
  "reason": "User is soliciting off-platform commercial payments and investments.",
  "category": "SCAM"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `reason` | String | Yes | Plain description of the incident (3 to 1000 characters). |
| `category` | String | Yes | Classification category: `"HARASSMENT"`, `"SCAM"`, `"INAPPROPRIATE_PROFILE"`, or `"OTHER"`. |

#### Response (`200 OK`)
```json
{
  "id": "case_01h89xyz9876543210",
  "status": "open",
  "message": "Report received for human review."
}
```

---

### 2. Admin Safety Report Management
*(Requires `admin`, `superadmin`, or `moderator` role)*

- **`GET /v1/admin/reports`**: Lists open and pending safety cases.
- **`PATCH /v1/admin/reports/:id`**: Resolves or updates status (`"open"`, `"investigating"`, `"resolved"`, `"dismissed"`).
  ```json
  {
    "status": "resolved",
    "reason": "Verified policy violation. Issued warning and hid profile."
  }
  ```
  Response: `{ "updated": true }`

---

## 🛠️ Legacy Safety Endpoints (`/api/safety/*`)

*When `ENABLE_LEGACY_API=true` is enabled:*

- `POST /api/safety/report`: Submits report with `{ targetUserId, reason, category, evidence }`.
- `GET /api/safety/reports`: Admin view for pending reports.
- `PATCH /api/safety/reports/:id`: Resolves safety cases.

---

*Maintained by AI Marriage Engineering Team.*
