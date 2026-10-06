# Superadmin & Operations Module — API Documentation

## 📍 Base URL
- **Primary Admin Prefix:** `http://localhost:8000/v1/admin`

---

## 🎯 Overview & Permissions

The Superadmin & Operations module provides complete platform governance, member lifecycle controls, safety report triage, photo moderation, audit trail inspection, matching policy simulation, configuration publication/rollback, and practice bot automation (`/v1/admin/*`).

### Role & Entitlement Matrix:
- **`super_admin` (`usertype: "superadmin"`):** Unrestricted platform governance. Can publish/rollback configurations, suspend/reinstate accounts, modify platform policies, and control automation.
- **`operations_admin` (`usertype: "admin"`):** Operational management, member warnings, report resolution, photo moderation, matching simulation, and read-only configuration inspection.
- **`moderator` (`usertype: "moderator"`):** Safety report triage and photograph moderation review.

---

## 📊 Endpoints Detail

### 1. Dashboard Overview KPIs
**`GET /v1/admin/overview`**

- **Full URL:** `http://localhost:8000/v1/admin/overview`
- **Auth Guard:** Bearer Access Token (`superadmin`, `admin`, `moderator`)

#### Response (`200 OK`)
```json
{
  "demo": false,
  "memberCount": 12450,
  "activeMembers": 11890,
  "openReports": 3,
  "publishedVersion": 1,
  "draftRevision": 0,
  "pendingChanges": 0,
  "masterGroups": 8,
  "matchingMode": "Deterministic · mobile policy v2",
  "llmCalls": 12,
  "paidMembers": 45,
  "productionReady": true
}
```

---

### 2. Search & List Members
**`GET /v1/admin/members`**

- **Full URL:** `http://localhost:8000/v1/admin/members`
- **Auth Guard:** Bearer Access Token (`superadmin`, `admin`, `moderator`)

#### Response (`200 OK`)
```json
{
  "items": [
    {
      "id": "cmu549khj001znzksahfvcjqp",
      "name": "Rohan Verma",
      "age": 28,
      "city": "Mumbai",
      "gender": "man",
      "occupation": "Product Lead",
      "education": "Master of Technology",
      "bio": "Curious by nature.",
      "interests": ["interest_coffee"],
      "values": ["family"],
      "lifestyle": ["active"],
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
      "photos": [
        {
          "id": "cmu549khk0023nzkse2ykzor8",
          "approved": true
        }
      ],
      "status": "active",
      "profileVersion": 3
    }
  ],
  "limited": false
}
```

---

### 3. Member Administrative Actions
**`POST /v1/admin/members/:id/action`**

- **Full URL:** `http://localhost:8000/v1/admin/members/:id/action`
- **Auth Guard:** Bearer Access Token (`superadmin` for suspend/reinstate; `admin` for hide/warn)

#### Request Body
```json
{
  "action": "suspend",
  "reason": "Repeated commercial solicitation reported and verified by safety team."
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `action` | String | Yes | `"suspend"`, `"reinstate"`, `"hide"`, or `"warn"`. |
| `reason` | String | Yes | Audit log explanation (3 to 1000 characters). |

#### Response (`200 OK`)
```json
{
  "recorded": true,
  "notificationSent": false
}
```

---

### 4. Safety Report Triage Queue
**`GET /v1/admin/reports`**

- **Full URL:** `http://localhost:8000/v1/admin/reports`
- **Auth Guard:** Bearer Access Token (`superadmin`, `admin`, `moderator`)

#### Response (`200 OK`)
```json
{
  "items": [
    {
      "id": "case_01h89xyz9876543210",
      "profileId": "cmu54acrr00manzks6oded6v4",
      "reporter": "cmu549khj001znzksahfvcjqp",
      "reason": "User is soliciting off-platform commercial payments.",
      "status": "open",
      "at": "2026-10-02T10:00:00.000Z"
    }
  ]
}
```

---

### 5. Resolve / Update Safety Case
**`PATCH /v1/admin/reports/:id`**

- **Full URL:** `http://localhost:8000/v1/admin/reports/:id`
- **Auth Guard:** Bearer Access Token (`superadmin`, `admin`, `moderator`)

#### Request Body
```json
{
  "status": "resolved",
  "reason": "Investigated case and confirmed policy violation. Account suspended."
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `status` | String | Yes | `"open"`, `"investigating"`, `"resolved"`, or `"dismissed"`. |
| `reason` | String | Yes | Resolution notes (3 to 1000 characters). |

#### Response (`200 OK`)
```json
{
  "updated": true
}
```

---

### 6. Audit Trail Logs
**`GET /v1/admin/audit`**

- **Full URL:** `http://localhost:8000/v1/admin/audit`
- **Auth Guard:** Bearer Access Token (`superadmin`, `admin`)

#### Response (`200 OK`)
```json
{
  "items": [
    {
      "id": "audit_123456789",
      "actor": "admin_user_id",
      "action": "member.suspend",
      "reason": "Commercial solicitation violation.",
      "timestamp": "2026-10-02T10:30:00.000Z",
      "outcome": "success",
      "target": "cmu54acrr00manzks6oded6v4"
    }
  ]
}
```

---

### 7. Matching Policy Simulator
**`POST /v1/admin/simulate`**

- **Full URL:** `http://localhost:8000/v1/admin/simulate`
- **Auth Guard:** Bearer Access Token (`superadmin`, `admin`)
- **Requirement:** Evaluates compatibility between two labelled fictional practice accounts.

#### Request Body
```json
{
  "leftId": "arjun",
  "rightId": "sofia",
  "source": "published"
}
```

#### Response (`200 OK`)
```json
{
  "eligibility": "PASS",
  "score": 92,
  "coverage": 100,
  "categories": [
    { "id": "values_intent", "label": "Values and intent", "weight": 35, "score": 95 },
    { "id": "reciprocal_preferences", "label": "Reciprocal preferences", "weight": 25, "score": 90 }
  ],
  "reasons": [
    "Compatible relationship expectations and long-term outlook."
  ],
  "differences": [],
  "ruleVersion": "1",
  "factorContributions": [],
  "evidenceCoverage": 100,
  "eligibilityChecks": [{ "outcome": "PASS", "code": "RECIPROCAL_RULES_EVALUATED" }],
  "missingInformation": [],
  "reciprocityMultiplier": 1,
  "source": "published"
}
```

---

### 8. Platform Governance & Master Configuration
- **`GET /v1/admin/platform`**: Returns full platform settings, policies, quiet hours, and channel rules.
- **`POST /v1/admin/platform`**: Updates platform schema revision (`superadmin` only).
- **`GET/POST /v1/admin/masters/*`**: Inspects or modifies master groups (geography, scoring, rules).
- **`POST /v1/admin/config/publish`**: Publishes draft configuration into a new published version.
- **`POST /v1/admin/config/rollback`**: Reverts active policy to a previous version number.

---

### 9. Practice Bot Automation Suite (`/v1/admin/automation/*`)
*(Requires `superadmin` role)*

- **`GET /v1/admin/automation`**: Returns automation controls, bot fleet status, and metrics.
- **`PATCH /v1/admin/automation/control`**: Toggles global bot automation:
  ```json
  {
    "enabled": true,
    "dailyReplyLimit": 5,
    "expectedRevision": 0
  }
  ```
- **`PATCH /v1/admin/automation/profiles/:id`**: Enables/disables automation on a specific fictional identity:
  ```json
  {
    "enabled": true
  }
  ```
- **`POST /v1/admin/automation/run`**: Executes a controlled reciprocal practice interaction between two eligible fictional profiles:
  ```json
  {
    "leftId": "arjun",
    "rightId": "sofia",
    "runId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
  ```

---

*Maintained by AI Marriage Engineering Team.*
