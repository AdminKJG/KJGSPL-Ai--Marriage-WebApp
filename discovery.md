# 🌟 Discover Page — API Specification & Web Integration Guide

This document provides a complete, production-ready specification of all APIs, pagination parameters, filter options, payloads, and response structures required to build and integrate the **Discover Page** in the Web Application (`KJGSPL-Ai--Marriage-WebApp`) or Mobile App.

---

## 📍 Base Configuration

- **Base URL:** `http://localhost:8000/v1` (Development) | `https://api.aimarriage.com/v1` (Production)
- **Content-Type:** `application/json`
- **Global Headers Required:**
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```

---

## 🧭 Overview of Discover Page APIs

| # | Endpoint | Method | Purpose / Action |
|---|---|---|---|
| 1 | `/v1/discovery` | `GET` | Fetch daily introduction feed with pagination & active filters |
| 2 | `/v1/interest` | `POST` | Send Connection Request / Express Interest (or form reciprocal match) |
| 3 | `
/v1/saved` | `POST` | Save / Bookmark profile (Shortlist) |
| 4 | `/v1/saved/:targetUserId` | `DELETE` | Remove profile from shortlist (Unsave) |
| 5 | `/v1/discovery/pass` | `POST` | Pass / Skip profile for today |
| 6 | `/v1/block` | `POST` | Block / Hide member permanently |
| 7 | `/v1/profiles/:id/compatibility` | `GET` | Fetch 5-category detailed compatibility breakdown modal |
| 8 | `/v1/locations/cities` | `GET` | Autocomplete city search for filters |
| 9 | `/v1/connections` | `GET` | Get saved, sent, received, & mutual connection status lists |

---

## 📊 API Details & Specifications

### 1. Get Daily Discovery Feed (With Pagination & Filters)
**`GET /v1/discovery`**

Fetches candidate cards for the current logged-in member. Supports server-side pagination and real-time filtering.

#### ⚙️ Query Parameters
| Parameter | Type | Required | Default | Example | Description |
|---|---|---|---|---|---|
| `page` | Integer | No | `1` | `1` | Page number for infinite scroll / pagination |
| `limit` | Integer | No | `10` | `10` | Number of items per page |
| `city` | String | No | — | `Delhi` | Filter candidates by city |
| `minAge` | Integer | No | `18` | `24` | Minimum age limit |
| `maxAge` | Integer | No | `99` | `32` | Maximum age limit |
| `gender` | String | No | `all` | `FEMALE` | Gender preference (`MALE`, `FEMALE`, `all`) |
| `interest` | String | No | — | `interest_coffee` | Shared interest tag filter |
| `religion` | String | No | — | `Hindu` | Religion filter |
| `caste` | String | No | — | `Brahmin` | Caste filter |
| `maritalStatus` | String | No | — | `Never Married` | Marital status filter |
| `education` | String | No | — | `Master` | Minimum qualification |
| `occupation` | String | No | — | `Engineer` | Occupation filter |

#### 📥 Request Example
```http
GET /v1/discovery?page=1&limit=10&city=Delhi&minAge=22&maxAge=32&gender=FEMALE HTTP/1.1
Host: api.aimarriage.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...
```

#### 📤 Response (`200 OK — Candidates Feed Received`)
```json
{
  "items": [
    {
      "id": "cmu54acrr00manzks6oded6v4",
      "name": "Priya Verma",
      "firstName": "Priya",
      "lastName": "Verma",
      "age": 27,
      "gender": "FEMALE",
      "city": "Delhi",
      "state": "Delhi",
      "country": "India",
      "occupation": "Technical Product Manager",
      "education": "M.Tech Software Engineering",
      "bio": "Creative and warm-hearted individual who enjoys music, coffee, and culinary experiments.",
      "heightCm": 165,
      "maritalStatus": "Never Married",
      "religion": "Hindu",
      "caste": "Brahmin",
      "motherTongue": "Hindi",
      "interests": [
        "interest_coffee",
        "travel",
        "music"
      ],
      "values": [
        "family",
        "growth"
      ],
      "lifestyle": [
        "active",
        "vegetarian"
      ],
      "intention": "A lasting relationship, open to marriage",
      "photos": [
        {
          "id": "photo_101",
          "url": "https://cdn.aimarriage.com/photos/priya_1.jpg",
          "approved": true,
          "isPrimary": true
        }
      ],
      "alignment": 88,
      "coverage": 100,
      "provisional": false,
      "isVerified": true,
      "connectionState": "none",
      "reason": "Compatible relationship goals and long-term outlook."
    }
  ],
  "page": 1,
  "nextPage": 2,
  "hasMore": true,
  "exposedToday": 1,
  "dailyLimit": 10,
  "remaining": 9,
  "day": "2026-10-06",
  "configVersion": 1,
  "mode": "connected",
  "reason": null
}
```

---

### 2. Send Connection Request / Express Interest
**`POST /v1/interest`**

Sends an express interest / connection request to a candidate. If the candidate has already expressed interest in you, a mutual **`Match`** is formed immediately.

#### 📥 Request Body
```json
{
  "targetUserId": "cmu54acrr00manzks6oded6v4",
  "message": "Hi Priya! I found your profile very alignment with my values."
}
```

#### 📤 Response A (`200 OK — First-time Interest Sent`)
```json
{
  "status": "sent",
  "message": "Express interest sent successfully."
}
```

#### 📤 Response B (`200 OK — Reciprocal Match Formed!`)
```json
{
  "status": "matched",
  "matchId": "match_9988776655",
  "message": "It's a Match! You can now start chatting."
}
```

---

### 3. Save / Shortlist Profile
**`POST /v1/saved`**

Bookmarks candidate profile to saved shortlists without sending an interest request yet.

#### 📥 Request Body
```json
{
  "targetUserId": "cmu54acrr00manzks6oded6v4"
}
```

#### 📤 Response (`200 OK`)
```json
{
  "saved": true,
  "targetUserId": "cmu54acrr00manzks6oded6v4",
  "message": "Profile added to shortlists."
}
```

---

### 4. Remove from Shortlist (Unsave Profile)
**`DELETE /v1/saved/:targetUserId`**

Removes profile from saved shortlists.

#### 📤 Response (`200 OK`)
```json
{
  "saved": false,
  "targetUserId": "cmu54acrr00manzks6oded6v4",
  "message": "Profile removed from shortlists."
}
```

---

### 5. Pass / Skip Candidate
**`POST /v1/discovery/pass`**

Skips candidate from current discovery feed so they won't appear again today.

#### 📥 Request Body
```json
{
  "targetUserId": "cmu54acrr00manzks6oded6v4"
}
```

#### 📤 Response (`200 OK`)
```json
{
  "passed": true,
  "targetUserId": "cmu54acrr00manzks6oded6v4",
  "message": "Profile passed."
}
```

---

### 6. Block Profile
**`POST /v1/block`**

Permanently blocks a member and hides them bidirectionally.

#### 📥 Request Body
```json
{
  "targetUserId": "cmu54acrr00manzks6oded6v4",
  "reason": "Inappropriate messages or fake profile"
}
```

#### 📤 Response (`200 OK`)
```json
{
  "blocked": true,
  "targetUserId": "cmu54acrr00manzks6oded6v4",
  "message": "Member blocked successfully."
}
```

---

### 7. Get Compatibility Detail Breakdown (Modal / Drawer)
**`GET /v1/profiles/:id/compatibility`**

Fetches detailed AI/Deterministic compatibility score breakdown across 5 core categories.

#### 📤 Response (`200 OK`)
```json
{
  "targetUserId": "cmu54acrr00manzks6oded6v4",
  "eligibility": "PASS",
  "score": 88,
  "coverage": 100,
  "categories": [
    {
      "id": "intentions",
      "label": "Relationship Intentions",
      "weight": 30,
      "score": 95
    },
    {
      "id": "values",
      "label": "Life Values & Family Background",
      "weight": 25,
      "score": 85
    },
    {
      "id": "cultural",
      "label": "Cultural Traditions & Acceptance",
      "weight": 15,
      "score": 90
    },
    {
      "id": "lifestyle",
      "label": "Daily Lifestyle & Communication",
      "weight": 15,
      "score": 80
    },
    {
      "id": "geography",
      "label": "Geography & Settlement",
      "weight": 15,
      "score": 88
    }
  ],
  "reasons": [
    "Compatible relationship goals and long-term outlook.",
    "Shared mutual interest in active lifestyle and travel."
  ],
  "differences": [],
  "computationMode": "deterministic"
}
```

---

### 8. City Autocomplete Search for Filters
**`GET /v1/locations/cities?q=Delhi`**

Returns suggested cities based on user input during filter configuration.

#### 📤 Response (`200 OK`)
```json
{
  "cities": [
    "Delhi, India",
    "New Delhi, India",
    "Delhi NCR, India"
  ]
}
```

---

### 9. Get User Connection Summary
**`GET /v1/connections`**

Retrieves active IDs for saved, sent, received, and mutual connections to update UI button states (e.g. "Saved", "Pending", "Matched").

#### 📤 Response (`200 OK`)
```json
{
  "saved": ["cmu54acrr00manzks6oded6v4"],
  "sent": ["user_id_102"],
  "received": ["user_id_103"],
  "mutual": ["user_id_104"]
}
```

---

## 💻 Web App Integration Code Snippets (JavaScript / React / Next.js)

### 1. Fetch Discovery Feed Hook / Function
```javascript
export async function fetchDiscoverFeed({ page = 1, limit = 10, filters = {} }) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(filters.city && filters.city !== 'All cities' ? { city: filters.city } : {}),
    ...(filters.gender ? { gender: filters.gender } : {}),
    ...(filters.minAge ? { minAge: String(filters.minAge) } : {}),
    ...(filters.maxAge ? { maxAge: String(filters.maxAge) } : {}),
    ...(filters.interest && filters.interest !== 'All interests' ? { interest: filters.interest } : {}),
  });

  const response = await fetch(`/v1/discovery?${query.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error('Failed to fetch discovery feed');
  return await response.json();
}
```

### 2. Send Interest / Connect Function
```javascript
export async function sendInterest(targetUserId, message = '') {
  const response = await fetch('/v1/interest', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ targetUserId, message })
  });

  if (!response.ok) throw new Error('Failed to send interest');
  return await response.json(); // returns { status: 'sent' } or { status: 'matched', matchId: '...' }
}
```

### 3. Save / Shortlist Function
```javascript
export async function toggleSaveProfile(targetUserId, isCurrentlySaved) {
  const method = isCurrentlySaved ? 'DELETE' : 'POST';
  const url = isCurrentlySaved ? `/v1/saved/${targetUserId}` : '/v1/saved';

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    ...(isCurrentlySaved ? {} : { body: JSON.stringify({ targetUserId }) })
  });

  if (!response.ok) throw new Error('Failed to update shortlist status');
  return await response.json();
}
```

---

## ⚡ Error Handling Standard Response

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid page parameter or user limit reached."
}
```
| Status Code | Meaning | Common Cause |
|---|---|---|
| `401 Unauthorized` | Missing / Expired Bearer Token | User needs to log in again |
| `403 Forbidden` | Profile Incomplete or Hidden | User must complete onboarding / enable visibility |
| `429 Too Many Requests` | Daily introducing limit hit | User reached 10 daily introductions |

---
*Documentation prepared for AI Marriage Web & App Integration.*
