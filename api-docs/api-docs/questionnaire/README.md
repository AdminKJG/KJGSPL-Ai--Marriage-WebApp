# Story & Questionnaire Module — API Documentation

## 📍 Base URL
- **Primary Mobile / Web Prefix:** `http://localhost:8000/v1`
- **Legacy REST Prefix (when enabled):** `http://localhost:8000/api/questionnaire`

---

## 🎯 Overview & Business Logic

The Story & Questionnaire module manages structured personal storytelling, multiple questionnaire chapters (rounds), reviewed responses, compatibility permissions, and mutual date planning proposals.

### Core Architecture Rules:
1. **Multi-Round Chapters:** The questionnaire is divided into sequential chapters (rounds) containing 5 questions each. Completing a round requires 5 reviewed answers (`POST /v1/story/rounds/:round/complete`).
2. **Granular Per-Answer Permissions:**
   - `reviewed`: User has verified the narrative and chosen canonical option.
   - `useForMatching`: Grants permission to include this answer in compatibility matching calculations.
   - `shareTranscript`: Grants permission to display the typed story narrative publicly on the profile.
3. **Questionnaire Versioning:** Answers include `questionnaireVersion`. If master questions change on the server, outdated submissions return `409 Conflict`.
4. **Mutual Date Proposals (`/v1/story/plans/:profileId`):** Mutual connections can collaboratively plan date details (`activity`, `venue`, `day`, `time`). Concurrency revisions prevent conflicting updates.

---

## 📊 Endpoints Detail

### 1. Get Story Questionnaire & Answer Progress
**`GET /v1/story`**

- **Full URL:** `http://localhost:8000/v1/story`
- **Auth Guard:** Bearer Access Token (`member`)

#### Response (`200 OK`)
```json
{
  "answers": [
    {
      "questionId": "weekend",
      "choiceId": "weekend_outdoor",
      "transcript": "I love spending Saturday mornings trail hiking and finding quiet coffee spots.",
      "reviewed": true,
      "useForMatching": true,
      "shareTranscript": true,
      "source": "typed",
      "questionnaireVersion": 1
    }
  ],
  "completedRounds": [0, 1],
  "datePlans": [
    {
      "activity": "Artisanal Coffee & Gallery Walk",
      "venue": "Alserkal Arts Cafe, Dubai",
      "day": "Saturday",
      "time": "18:00",
      "profileId": "cmu54acrr00manzks6oded6v4",
      "status": "pending",
      "proposerId": "cmu549khj001znzksahfvcjqp",
      "receiverId": "cmu54acrr00manzks6oded6v4",
      "canRespond": false,
      "revision": 1,
      "updatedAt": "2026-10-02T10:00:00.000Z",
      "bookingConfirmed": false,
      "simulatedResponse": false
    }
  ],
  "questions": [
    {
      "id": "weekend",
      "title": "A Weekend in Your Life",
      "choices": [
        { "id": "weekend_outdoor", "label": "Outdoors & Activities" },
        { "id": "weekend_quiet", "label": "Quiet & Restorative" }
      ]
    }
  ],
  "questionnaireVersion": 1,
  "demo": false,
  "disclosure": "Only reviewed text and choices are stored. Audio remains on your device. Date acceptance requires the other member."
}
```

---

### 2. Save / Update Single Story Answer
**`PUT /v1/story/answers/:id`**

- **Full URL:** `http://localhost:8000/v1/story/answers/:id`
- **Auth Guard:** Bearer Access Token (`member`)

#### Request Body
```json
{
  "questionnaireVersion": 1,
  "questionId": "weekend",
  "choiceId": "weekend_outdoor",
  "transcript": "I love spending Saturday mornings trail hiking and finding quiet coffee spots.",
  "reviewed": true,
  "useForMatching": true,
  "shareTranscript": true,
  "source": "typed"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `questionnaireVersion` | Integer | Yes | Current active questionnaire version. |
| `questionId` | String | Yes | Must match the URL `:id` parameter. |
| `choiceId` | String | Yes | Supported canonical option ID for this question. |
| `transcript` | String | Yes | Narrative text (max 2000 chars). |
| `reviewed` | Boolean | Yes | Mark answer as verified. |
| `useForMatching` | Boolean | Yes | Grant permission for matching computation. |
| `shareTranscript` | Boolean | Yes | Grant permission to show transcript publicly. |
| `source` | String | Yes | `"typed"`, `"recorded"`, or `"demo"`. |

#### Response (`200 OK`)
```json
{
  "answer": {
    "id": "cm8ans001xyz",
    "userId": "cmu549khj001znzksahfvcjqp",
    "questionnaireVersion": 1,
    "questionId": "weekend",
    "choiceId": "weekend_outdoor",
    "transcript": "I love spending Saturday mornings trail hiking and finding quiet coffee spots.",
    "reviewed": true,
    "useForMatching": true,
    "shareTranscript": true,
    "source": "typed",
    "createdAt": "2026-10-02T10:00:00.000Z",
    "updatedAt": "2026-10-02T10:00:00.000Z"
  }
}
```

---

### 3. Delete Story Answer
**`DELETE /v1/story/answers/:id`**

- **Full URL:** `http://localhost:8000/v1/story/answers/:id`
- **Auth Guard:** Bearer Access Token (`member`)

#### Response (`200 OK`)
```json
{
  "deleted": true
}
```

---

### 4. Complete Questionnaire Chapter (Round)
**`POST /v1/story/rounds/:id/complete`**

- **Full URL:** `http://localhost:8000/v1/story/rounds/:id/complete`
- **Auth Guard:** Bearer Access Token (`member`)
- **Requirement:** Exactly 5 reviewed answers must exist for the specified chapter index.

#### Response (`200 OK`)
```json
{
  "completed": true
}
```

---

### 5. Propose or Respond to Date Plan
**`PUT /v1/story/plans/:id`**

- **Full URL:** `http://localhost:8000/v1/story/plans/:id` (where `:id` is the partner's profile ID)
- **Auth Guard:** Bearer Access Token (`member`)
- **Requirement:** Active mutual connection.

#### Request Body
```json
{
  "profileId": "cmu54acrr00manzks6oded6v4",
  "activity": "Coffee & Gallery Walk",
  "venue": "Alserkal Arts Cafe, Dubai",
  "day": "Saturday",
  "time": "18:00",
  "status": "pending",
  "revision": 1
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `profileId` | String | Yes | Partner's profile ID (must match URL `:id`). |
| `activity` | String | Yes | Planned activity (max 240 chars). |
| `venue` | String | Yes | Public venue name / address (max 240 chars). |
| `day` | String | Yes | Proposed day (e.g. `"Saturday"` or `"2026-10-10"`). |
| `time` | String | Yes | Proposed time (e.g. `"18:00"`). |
| `status` | String | Yes | `"draft"`, `"pending"`, `"accepted"`, `"declined"`, `"cancelled"`. |
| `revision` | Integer | No | Concurrency revision counter. |

#### Response (`200 OK`)
```json
{
  "plan": {
    "activity": "Coffee & Gallery Walk",
    "venue": "Alserkal Arts Cafe, Dubai",
    "day": "Saturday",
    "time": "18:00",
    "profileId": "cmu54acrr00manzks6oded6v4",
    "status": "pending",
    "revision": 2,
    "canRespond": false,
    "updatedAt": "2026-10-02T10:15:00.000Z",
    "simulatedResponse": false,
    "bookingConfirmed": false
  }
}
```

---

### 6. Cancel Date Plan
**`DELETE /v1/story/plans/:id`**

- **Full URL:** `http://localhost:8000/v1/story/plans/:id`
- **Auth Guard:** Bearer Access Token (`member`)

#### Response (`200 OK`)
```json
{
  "cancelled": true
}
```

---

*Maintained by AI Marriage Engineering Team.*
