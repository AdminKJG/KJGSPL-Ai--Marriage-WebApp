# Profile & Member Experience Module — API Documentation

## 📍 Base URL
- **Primary / Mobile Prefix:** `http://localhost:8000/v1`
- **Legacy REST Prefix (when enabled):** `http://localhost:8000/api/profile`

---

## 🎯 Overview & Business Logic

The Profile module manages member profile data, personal attributes, relationship intentions, partner preferences, cultural traditions, visibility settings, and public profile views.

### Core Architecture Rules:
1. **Privacy Allowlist on Public Profiles:** Private questionnaire answers, date of birth, email, phone numbers, and partner preferences are strictly excluded when viewing other members' profiles.
2. **Cultural Preferences & DPDP Consent:** Opt-in consent (`cultural.consent: true`) allows members to define their own cultural attributes and accepted partner backgrounds across up to 7 cultural dimensions.
3. **Visibility Controls:**
   - `"visible"`: Included in discovery feeds and search results.
   - `"hidden"`: Profile remains private and excluded from candidate discovery.
   - `"connections"`: Visible only to established connections.
4. **Practice Bot Visibility:** Fictional automated practice profiles are hidden from member discovery unless the member opts in via `settings.practiceInteractions: true`.
5. **Cascading Account Deletion:** Calling `DELETE /v1/me` removes active sessions, cascades matches/conversations/notifications, redacts safety evidence records, and queues private MinIO photographs for deletion.

---

## 📊 Endpoints Detail

### 1. Get Own Profile & Experience State
**`GET /v1/me`**

- **Full URL:** `http://localhost:8000/v1/me`
- **Auth Guard:** Bearer Access Token (`member`)

#### Response (`200 OK`)
```json
{
  "id": "cmu549khj001znzksahfvcjqp",
  "name": "Rohan Verma",
  "age": 28,
  "city": "Mumbai",
  "gender": "man",
  "occupation": "Product Lead",
  "education": "Master of Technology",
  "bio": "Curious by nature. Passionate about product design, long conversations, and morning hikes.",
  "interests": ["interest_coffee", "interest_hiking", "interest_reading"],
  "values": ["family", "growth", "integrity"],
  "lifestyle": ["active", "travel"],
  "futurePlans": "Building a joyful, balanced home and growing together.",
  "prompts": [
    {
      "question": "What does your ideal Sunday look like?",
      "answer": "A slow coffee, a good book, and cooking a fresh lunch."
    }
  ],
  "languages": ["English", "Hindi"],
  "intention": "A lasting relationship, open to marriage",
  "visibility": "visible",
  "fictional": false,
  "automated": false,
  "identityLabel": null,
  "cultural": {
    "consent": true,
    "own": {
      "religion": "Hindu",
      "mother_tongue": "Hindi",
      "community": "Agarwal",
      "diet": "Vegetarian"
    },
    "accepted": {
      "religion": ["Hindu"],
      "diet": ["Vegetarian", "Eggetarian"]
    },
    "publicFields": ["religion", "mother_tongue", "diet"]
  },
  "image": null,
  "photos": [
    {
      "id": "cmu549khk0023nzkse2ykzor8",
      "approved": true
    }
  ],
  "publicStoryAnswers": [
    {
      "questionId": "weekend",
      "transcript": "I enjoy exploring quiet trails and discovering specialty coffee roasters."
    }
  ],
  "sampleStoryTranscripts": {
    "weekend": "I enjoy exploring quiet trails and discovering specialty coffee roasters."
  },
  "alignment": null,
  "dateOfBirth": "1998-05-15",
  "onboarding": {
    "complete": true,
    "questionnaireVersion": 1,
    "answers": {}
  },
  "preferences": {
    "minAge": 24,
    "maxAge": 32,
    "gender": "woman",
    "city": "Mumbai",
    "settlementCities": ["Mumbai", "Pune", "Bengaluru"],
    "hardAnswers": {},
    "softAnswers": {}
  },
  "settings": {
    "sound": false,
    "reduceMotion": false,
    "notifications": true,
    "practiceInteractions": true,
    "visibility": "visible"
  },
  "adultConfirmed": true,
  "onboardingComplete": true,
  "matchingConsent": true,
  "blocked": ["cmu54blocked001"],
  "blockedProfiles": [
    {
      "id": "cmu54blocked001",
      "name": "Blocked Member",
      "city": "",
      "age": 18
    }
  ],
  "savedEvents": ["event_mumbai_coffee_mixer"],
  "revision": 3
}
```

---

### 2. Update Profile, Preferences, Settings & Answers
**`PATCH /v1/me`**

- **Full URL:** `http://localhost:8000/v1/me`
- **Auth Guard:** Bearer Access Token (`member`)

#### Request Body
```json
{
  "name": "Rohan Verma",
  "city": "Mumbai",
  "gender": "man",
  "occupation": "Product Lead",
  "education": "Master of Technology",
  "bio": "Curious by nature. Passionate about product design and morning hikes.",
  "dateOfBirth": "1998-05-15",
  "adultConfirmed": true,
  "interests": ["interest_coffee", "interest_hiking"],
  "values": ["family", "growth"],
  "lifestyle": ["active"],
  "languages": ["English", "Hindi"],
  "preferences": {
    "minAge": 24,
    "maxAge": 32,
    "gender": "woman",
    "city": "Mumbai",
    "settlementCities": ["Mumbai", "Pune"]
  },
  "cultural": {
    "consent": true,
    "own": {
      "religion": "Hindu",
      "diet": "Vegetarian"
    },
    "accepted": {
      "religion": ["Hindu"],
      "diet": ["Vegetarian"]
    },
    "publicFields": ["religion", "diet"]
  },
  "culturalConsentVersion": 1,
  "culturalRevision": 1,
  "versionedAnswers": {
    "questionnaireVersion": 1,
    "answers": {
      "question_intent": "intent_marriage",
      "question_communication": "communication_spontaneous"
    }
  },
  "settings": {
    "visibility": "visible",
    "notifications": true,
    "reducedMotion": false,
    "practiceInteractions": true
  },
  "matchingConsent": true,
  "onboardingComplete": true
}
```

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Display name (2–80 characters). |
| `city` | String | Current living city. |
| `gender` | String | `"man"`, `"woman"`, or `"nonbinary"`. |
| `occupation` | String | Occupation title. |
| `education` | String | Highest degree / field of study. |
| `bio` / `introduction` | String | Narrative about me (max 2000 chars). |
| `dateOfBirth` | String | ISO `YYYY-MM-DD` date string (age 18–99). |
| `adultConfirmed` | Boolean | Must be literal `true`. |
| `interests` | Array\<String\> | Up to 20 interest tags. |
| `values` | Array\<String\> | Up to 20 core value tags. |
| `lifestyle` | Array\<String\> | Up to 20 lifestyle tags. |
| `languages` | Array\<String\> | Up to 10 spoken languages. |
| `prompts` | Array\<Object\> | Up to 6 `{ question, answer }` prompt items. |
| `preferences` | Object | Partner preference constraints (`minAge`, `maxAge`, `gender`, `city`, `settlementCities`). |
| `cultural` | Object | Cultural traditions (`consent`, `own`, `accepted`, `publicFields`). |
| `versionedAnswers` | Object | Questionnaire answers (`questionnaireVersion`, `answers`). |
| `settings` | Object | Application settings (`visibility`, `notifications`, `reducedMotion`, `practiceInteractions`). |
| `matchingConsent` | Boolean | Explicit consent to participate in compatibility scoring. |
| `onboardingComplete` | Boolean | True when onboarding steps are completed. |

#### Response (`200 OK`)
Returns the complete updated `GET /v1/me` profile object.

---

### 3. View Public Member Profile
**`GET /v1/profiles/:id`**

- **Full URL:** `http://localhost:8000/v1/profiles/:id`
- **Auth Guard:** Bearer Access Token (`member`)
- **Quota Tracking:** Automatically records a profile view in daily exposure tracking.

#### Response (`200 OK`)
```json
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
  "alignment": null
}
```

---

### 4. Perform Profile Actions
**`POST /v1/profiles/:id/:action`**

- **Full URL:** `http://localhost:8000/v1/profiles/:id/:action`
- **Auth Guard:** Bearer Access Token (`member`)
- **Supported Actions:** `save`, `interest`, `connect`, `unmatch`, `block`, `unblock`, `report`.

#### Action: `save` (Bookmark Profile)
```json
// POST /v1/profiles/:id/save
{ "saved": true }
```
Response: `{ "saved": true }`

#### Action: `interest` or `connect` (Send Interest)
Response:
```json
{
  "success": true,
  "status": "sent", // or "matched" if reciprocal
  "matchId": "cmu54matchId", // if mutual
  "interestSent": true,
  "mutual": false,
  "chatAvailable": false
}
```

#### Action: `unmatch`
Response:
```json
{
  "blocked": false,
  "mutual": false,
  "chatAvailable": false
}
```

#### Action: `block`
Response:
```json
{
  "blocked": true,
  "mutual": false,
  "chatAvailable": false
}
```

#### Action: `unblock`
Response:
```json
{
  "blocked": false
}
```

#### Action: `report` (File Safety Case)
```json
// POST /v1/profiles/:id/report
{
  "reason": "Suspicious account asking for commercial funds.",
  "category": "SCAM" // "HARASSMENT" | "SCAM" | "INAPPROPRIATE_PROFILE" | "OTHER"
}
```
Response:
```json
{
  "id": "case_01h89xyz",
  "status": "open",
  "message": "Report received for human review."
}
```

---

### 5. Delete Account & Personal Data
**`DELETE /v1/me`**

- **Full URL:** `http://localhost:8000/v1/me`
- **Auth Guard:** Bearer Access Token (`member`)

#### Response (`200 OK`)
```json
{
  "deleted": true,
  "scope": "Connected account and profile access removed. Private storage objects are queued for deletion with retries; backups follow the operator retention schedule. Redacted safety records and legally required payment records may be retained. Device recordings are deleted separately by the app."
}
```

---

*Maintained by AI Marriage Engineering Team.*
