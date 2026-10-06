# Interest & Connections Module — API Documentation

## 📍 Base URL
- **Primary Mobile / Web Prefix:** `http://localhost:8000/v1`
- **Legacy REST Prefix (when enabled):** `http://localhost:8000/api/interest`

---

## 🎯 Overview & Business Logic

The Interest & Connections module governs member expressions of interest, reciprocal matchmaking, bookmarks, and connection grouping.

### Core Match Lifecycle:
1. **Sending Interest:** Member A sends interest to Member B (`POST /v1/interest` or `POST /v1/profiles/:id/interest`).
2. **Mutual Match Creation:** When Member B reciprocates interest to Member A, an active **`Match`** record is established immediately, creating a 1-on-1 `Conversation` room.
3. **Four Connection Categories (`GET /v1/connections`):**
   - **`saved`:** Candidate profiles bookmarked by the member.
   - **`sent`:** Unreciprocated interests initiated by the member.
   - **`received`:** Interests received from other members awaiting a response.
   - **`mutual`:** Active reciprocal connections with messaging and calling enabled.
4. **Unmatching:** Calling `POST /v1/unmatch` or `POST /v1/profiles/:id/unmatch` immediately terminates the match, deletes interest records, and disables chat access.

---

## 📊 Endpoints Detail

### 1. Get All Connections
**`GET /v1/connections`**

- **Full URL:** `http://localhost:8000/v1/connections`
- **Auth Guard:** Bearer Access Token (`member`)

#### Response (`200 OK`)
```json
{
  "saved": [
    {
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
    }
  ],
  "sent": [],
  "received": [],
  "mutual": [
    {
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
    }
  ]
}
```

---

### 2. Send Interest / Connect
**`POST /v1/interest`** (or `POST /v1/profiles/:id/interest` / `POST /v1/profiles/:id/connect`)

- **Full URL:** `http://localhost:8000/v1/interest`
- **Auth Guard:** Bearer Access Token (`member`)

#### Request Body
```json
{
  "targetUserId": "cmu54acrr00manzks6oded6v4"
}
```

*(Note: Accepted key aliases include `targetUserId`, `receiverId`, `targetId`, or `userId`)*

#### Response (`200 OK — First-Time Interest Sent`)
```json
{
  "success": true,
  "status": "sent",
  "matchId": null,
  "interestSent": true,
  "mutual": false,
  "chatAvailable": false
}
```

#### Response (`200 OK — Reciprocal Match Created`)
```json
{
  "success": true,
  "status": "matched",
  "matchId": "cmu54match9876543210",
  "interestSent": true,
  "mutual": true,
  "chatAvailable": true
}
```

---

### 3. Unmatch Connection
**`POST /v1/unmatch`** (or `POST /v1/profiles/:id/unmatch`)

- **Full URL:** `http://localhost:8000/v1/unmatch`
- **Auth Guard:** Bearer Access Token (`member`)

#### Request Body
```json
{
  "targetUserId": "cmu54acrr00manzks6oded6v4"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "unmatched": true,
  "mutual": false,
  "chatAvailable": false
}
```

---

*Maintained by AI Marriage Engineering Team.*
