# Compatibility Matching Module — API Documentation

## 📍 Base URL
- **Primary Mobile / Web Prefix:** `http://localhost:8000/v1`
- **Legacy REST Prefix (when enabled):** `http://localhost:8000/api/matching`

---

## 🎯 Overview & Business Logic

The Compatibility Matching module computes multi-category deterministic compatibility scores, eligibility status, explanatory reasons, confidence bounds, and difference breakdowns between two members (`GET /v1/profiles/:id/compatibility`).

### Core Matching Principles:
1. **Deterministic Scoring Engine:** Compatibility is calculated strictly from confirmed questionnaire choices, intentions, lifestyle values, and reciprocal partner preferences.
2. **Never Uses Photographs or Audio:** Photographs, biometric appearance, and private voice recordings never enter scoring algorithms (`modelCalled: false`).
3. **5 Standardized Scored Categories:**
   - **Values and Intent (`values_intent`)** (Weight: 35%): Relationship horizon, marriage timeline, core life philosophy, and ethical foundation.
   - **Reciprocal Preferences (`reciprocal_preferences`)** (Weight: 25%): Mutual satisfaction of age bounds, residence preferences, and dietary/cultural expectations.
   - **Lifestyle and Family (`lifestyle_family`)** (Weight: 20%): Living habits, work-life balance, family involvement, and daily rhythms.
   - **Location Willingness (`location_willingness`)** (Weight: 10%): Current residence alignment and shared settlement city flexibility.
   - **Interests and Communication (`interests_communication`)** (Weight: 10%): Shared leisure interests, conversation cadence, and interpersonal communication styles.
4. **Eligibility States:**
   - `PASS`: Both members satisfy reciprocal constraints (age range, settlement willingness).
   - `FAIL`: At least one strict criteria boundary was breached.
   - `UNRESOLVED`: Insufficient answered chapters to establish firm coverage.

---

## 📊 Endpoints Detail

### 1. Get Profile Compatibility Breakdown
**`GET /v1/profiles/:id/compatibility`**

- **Full URL:** `http://localhost:8000/v1/profiles/:id/compatibility`
- **Auth Guard:** Bearer Access Token (`member`)

#### Response (`200 OK`)
```json
{
  "eligibility": "PASS",
  "score": 88,
  "coverage": 100,
  "categories": [
    {
      "id": "values_intent",
      "label": "Values and intent",
      "weight": 35,
      "score": 92
    },
    {
      "id": "reciprocal_preferences",
      "label": "Reciprocal preferences",
      "weight": 25,
      "score": 88
    },
    {
      "id": "lifestyle_family",
      "label": "Lifestyle and family",
      "weight": 20,
      "score": 90
    },
    {
      "id": "location_willingness",
      "label": "Location willingness",
      "weight": 10,
      "score": 84
    },
    {
      "id": "interests_communication",
      "label": "Interests and communication",
      "weight": 10,
      "score": 86
    }
  ],
  "reasons": [
    "Compatible relationship expectations and long-term outlook.",
    "Shared values and aligned lifestyle preferences."
  ],
  "differences": [],
  "lowerBound": 80,
  "upperBound": 96,
  "configVersion": 1,
  "modelCalled": false,
  "computationMode": "deterministic",
  "missingRequirements": [],
  "profileId": "cmu54acrr00manzks6oded6v4",
  "illustrative": false,
  "demo": false,
  "label": "Alignment of shared answers"
}
```

| Field | Type | Description |
| :--- | :--- | :--- |
| `eligibility` | String | `"PASS"`, `"FAIL"`, or `"UNRESOLVED"`. |
| `score` | Number | Overall compatibility rating (0 to 100). |
| `coverage` | Number | Percentage of questionnaire evidence available for comparison (0 to 100). |
| `categories` | Array\<Object\> | Breakdown across the 5 canonical compatibility categories with `id`, `label`, `weight`, and `score`. |
| `reasons` | Array\<String\> | Plain English explanations of shared compatibility strengths. |
| `differences` | Array\<String\> | Identified divergence areas between preferences. |
| `lowerBound` | Number | Estimated minimum score confidence bound. |
| `upperBound` | Number | Estimated maximum score confidence bound. |
| `missingRequirements` | Array\<String\> | List of uncompleted prerequisites (e.g. `matchingConsent`, `storyChapters`, `location`, `partnerPreferences`). |
| `profileId` | String | Target profile identifier. |
| `illustrative` | Boolean | True if one or both profiles are synthetic/fictional identities. |
| `label` | String | Human-readable title for UI rendering. |

---

*Maintained by AI Marriage Engineering Team.*
