# Candidate Discovery Module — API Documentation

## 📍 Base URL
- **Primary Mobile / Web Prefix:** `http://localhost:8000/v1`
- **Legacy REST Prefix (when enabled):** `http://localhost:8000/api/discovery`

---

## 🎯 Overview & Business Logic

The Candidate Discovery module delivers a daily, compatibility-ranked feed of candidate profiles tailored for matrimonial consideration (`GET /v1/discovery`).

### Key Rules & Mechanics:
1. **Onboarding & Visibility Gating:** Members must complete onboarding (`onboardingComplete: true`) and enable discovery visibility (`visibility: "visible"`) to receive candidate recommendations.
2. **Stateful Daily Quota Tracking:** The backend tracks profile exposures statefully in PostgreSQL using UTC calendar dates (`YYYY-MM-DD`). Profiles exposed today are preserved across page navigations and refreshes.
3. **Pre-Filtering:** Multi-attribute database filters are applied **before** deterministic ranking and pagination.
4. **Deterministic Ranking Engine:** Candidates are evaluated across values, partner preferences, lifestyle, settlement choices, and questionnaire answers to produce compatibility alignment scores.
5. **Auto-Seeding Fallback:** If fewer than 10 active candidates exist in the development database, realistic demo profiles are automatically seeded to provide a rich interactive discovery experience.

---

## 📊 Endpoints Detail

### 1. Get Daily Discovery Feed
**`GET /v1/discovery`**

- **Full URL:** `http://localhost:8000/v1/discovery`
- **Auth Guard:** Bearer Access Token (`member`)
- **Rate Limit:** 240 req / min

#### Query Parameters (All Optional)

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `page` | Integer | `1` | 1-based page number. |
| `limit` | Integer | `20` | Items per page (clamped between 1 and 100). |
| `gender` | String | — | Exact gender match (case-insensitive): `man`, `woman`, `nonbinary`. |
| `city` | String | — | Exact residence city match (case-insensitive). |
| `religion` | String | — | Exact religion match (case-insensitive). |
| `caste` | String | — | Exact caste match (case-insensitive). |
| `motherTongue` | String | — | Exact mother tongue match (case-insensitive). |
| `country` | String | — | Exact country match (case-insensitive). |
| `state` | String | — | Exact state / province match (case-insensitive). |
| `maritalStatus`| String | — | Exact marital status match (case-insensitive). |
| `diet` | String | — | Exact diet match: `Vegetarian`, `Non-Vegetarian`, `Eggetarian`, `Vegan`, `Jain`. |
| `smoking` | String | — | Exact smoking preference match. |
| `drinking` | String | — | Exact drinking preference match. |
| `education` | String | — | Case-insensitive substring match on degree or field of study. |
| `occupation` | String | — | Case-insensitive substring match on profession title. |
| `ageMin` | Integer | — | Minimum candidate age (calculated from date of birth). |
| `ageMax` | Integer | — | Maximum candidate age (calculated from date of birth). |

#### Example Request
```http
GET /v1/discovery?page=1&limit=10&gender=woman&city=Mumbai&ageMin=23&ageMax=30 HTTP/1.1
Host: localhost:8000
Authorization: Bearer <accessToken>
Accept: application/json
```

#### Success Response (`200 OK — Active Recommendations`)
```json
{
  "items": [
    {
      "id": "cmu54acrr00manzks6oded6v4",
      "name": "Ananya Sharma",
      "age": 27,
      "city": "Mumbai",
      "gender": "woman",
      "occupation": "Senior Architect",
      "education": "Master of Architecture",
      "bio": "Passionate about sustainable architecture, sketching urban spaces, and exploring local cuisine.",
      "interests": ["interest_architecture", "interest_art", "interest_coffee"],
      "values": ["creativity", "family", "sustainability"],
      "lifestyle": ["early_riser", "active"],
      "futurePlans": "Designing meaningful spaces and building a supportive partnership.",
      "prompts": [],
      "languages": ["English", "Hindi", "Marathi"],
      "intention": "A lasting relationship, open to marriage",
      "visibility": "visible",
      "fictional": false,
      "automated": false,
      "identityLabel": null,
      "cultural": {
        "religion": "Hindu",
        "diet": "Vegetarian"
      },
      "image": null,
      "photos": [
        {
          "id": "cmu54acrs00nwnzksul2hge88"
        }
      ],
      "publicStoryAnswers": [
        {
          "questionId": "weekend",
          "transcript": "Exploring art galleries and quiet heritage trails across south Mumbai."
        }
      ],
      "sampleStoryTranscripts": {
        "weekend": "Exploring art galleries and quiet heritage trails across south Mumbai."
      },
      "alignment": 92,
      "coverage": 100,
      "provisional": false,
      "reason": "Compatible profile preferences and relationship outlook."
    }
  ],
  "exposedToday": 1,
  "dailyLimit": 10,
  "day": "2026-10-02",
  "page": 1,
  "limit": 10,
  "total": 12,
  "hasMore": true,
  "nextPage": 2,
  "configVersion": 1,
  "mode": "connected",
  "reason": null
}
```

#### Response (`200 OK — Incomplete Onboarding or Hidden Profile`)
```json
{
  "items": [],
  "exposedToday": 0,
  "dailyLimit": 10,
  "reason": "Finish your profile and enable discovery.",
  "page": 1,
  "limit": 20,
  "total": 0,
  "hasMore": false,
  "nextPage": null
}
```

---

*Maintained by AI Marriage Engineering Team.*
