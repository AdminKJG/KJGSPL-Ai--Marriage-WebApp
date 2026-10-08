# 🔗 Connections Page — API Specification & Web/App Integration Guide

This document provides a complete, production-ready API specification for all endpoints, payloads, HTTP methods, headers, and responses required for the **Connections Page** (Saved Shortlists, Sent Requests, Received Requests, and Mutual Matches).

---

## 📍 Base Configuration

- **Base URL:** `http://localhost:8000/v1` (Development) | `https://api.aimarriage.com/v1` (Production)
- **Global Headers Required:**
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```

---

## 🧭 Connections Page API Summary

| # | Endpoint | Method | Purpose / User Action |
|---|---|---|---|
| 1 | `/v1/connections` | `GET` | Fetch all categorized connection lists (`saved`, `sent`, `received`, `mutual`) |
| 2 | `/v1/connections/:category` | `GET` | Fetch paginated list for specific tab (`/v1/connections/saved?page=1`) |
| 3 | `/v1/interest` | `POST` | Express Interest OR Accept Received Request (Forms Mutual Match) |
| 4 | `/v1/saved` | `POST` | Bookmark profile to Saved Shortlist |
| 5 | `/v1/saved/:targetUserId` | `DELETE` | Remove profile from Saved Shortlist (Unsave) |
| 6 | `/v1/unmatch` | `POST` | Unmatch / Terminate active mutual connection |
| 7 | `/v1/block` | `POST` | Block and hide member permanently |
| 8 | `/v1/connections/counts` | `GET` | Get badge counts for tabs (`savedCount`, `sentCount`, `receivedCount`, `mutualCount`) |

---

## 📊 Endpoints Detail & Payloads

### 1. Get All Connections & Categories
**`GET /v1/connections`**

Fetches all member profiles organized across the 4 connection states:
- **`saved`:** Bookmarked profiles for later consideration.
- **`sent`:** Interests initiated by current user awaiting candidate response.
- **`received`:** Interests received from candidates waiting for your response.
- **`mutual`:** Active reciprocal matches with active chat privileges.

#### 📥 Request Example
```http
GET /v1/connections HTTP/1.1
Host: api.aimarriage.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...
```

#### 📤 Response (`200 OK`)
```json
{
  "saved": [
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
      "bio": "Creative and warm-hearted individual.",
      "heightCm": 165,
      "maritalStatus": "Never Married",
      "religion": "Hindu",
      "caste": "Brahmin",
      "interests": ["interest_coffee", "travel"],
      "values": ["family"],
      "lifestyle": ["active"],
      "intention": "A lasting relationship, open to marriage",
      "photos": [
        {
          "id": "photo_101",
          "url": "https://cdn.aimarriage.com/photos/priya_1.jpg",
          "isPrimary": true
        }
      ],
      "alignment": 88,
      "connectionState": "saved"
    }
  ],
  "sent": [
    {
      "id": "cmu54acrr00manzks6oded6v5",
      "name": "Ananya Sharma",
      "age": 26,
      "city": "Mumbai",
      "occupation": "Architect",
      "photos": [{ "url": "https://cdn.aimarriage.com/photos/ananya_1.jpg" }],
      "alignment": 89,
      "connectionState": "sent"
    }
  ],
  "received": [
    {
      "id": "cmu54acrr00manzks6oded6v6",
      "name": "Sneha Iyer",
      "age": 28,
      "city": "Chennai",
      "occupation": "Financial Analyst",
      "photos": [{ "url": "https://cdn.aimarriage.com/photos/sneha_1.jpg" }],
      "alignment": 87,
      "connectionState": "received"
    }
  ],
  "mutual": [
    {
      "id": "cmu54acrr00manzks6oded6v7",
      "name": "Rohan Malhotra",
      "age": 29,
      "city": "Bengaluru",
      "occupation": "AI Lead Engineer",
      "photos": [{ "url": "https://cdn.aimarriage.com/photos/rohan_1.jpg" }],
      "alignment": 92,
      "connectionState": "mutual",
      "matchId": "match_99887766"
    }
  ]
}
```

---

### 2. Get Paginated Connection Category
**`GET /v1/connections/:category`**

Fetches paginated list for a specific category tab (`saved`, `sent`, `received`, `mutual`).

#### ⚙️ Path & Query Parameters
- `category`: `saved` | `sent` | `received` | `mutual`
- `page`: Page index (default: `1`)
- `limit`: Page size (default: `10`)

#### 📥 Request Example
```http
GET /v1/connections/saved?page=1&limit=10 HTTP/1.1
Host: api.aimarriage.com
Authorization: Bearer <access_token>
```

#### 📤 Response (`200 OK`)
```json
{
  "category": "saved",
  "items": [
    {
      "id": "cmu54acrr00manzks6oded6v4",
      "name": "Priya Verma",
      "age": 27,
      "city": "Delhi",
      "occupation": "Technical Product Manager",
      "photos": [{ "url": "https://cdn.aimarriage.com/photos/priya_1.jpg" }],
      "alignment": 88
    }
  ],
  "page": 1,
  "nextPage": 2,
  "hasMore": false,
  "total": 1
}
```

---

### 3. Express Interest / Accept Received Request
**`POST /v1/interest`**

- If target user has not expressed interest: Sends an interest request (`status: "sent"`).
- If target user has ALREADY expressed interest: Accepts request and creates a reciprocal **Match** (`status: "matched"`).

#### 📥 Request Body
```json
{
  "targetUserId": "cmu54acrr00manzks6oded6v6",
  "message": "Hi! Gladly accepting your connection request."
}
```

#### 📤 Response A (First-time Sent)
```json
{
  "status": "sent",
  "message": "Interest request sent successfully."
}
```

#### 📤 Response B (Reciprocal Match Created!)
```json
{
  "status": "matched",
  "matchId": "match_99887766",
  "message": "It's a Match! You can now start messaging."
}
```

---

### 4. Save Profile to Shortlist
**`POST /v1/saved`**

Bookmarks candidate profile to saved shortlist.

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

### 5. Remove from Shortlist (Unsave Profile)
**`DELETE /v1/saved/:targetUserId`**

Removes profile from saved shortlist.

#### 📤 Response (`200 OK`)
```json
{
  "saved": false,
  "targetUserId": "cmu54acrr00manzks6oded6v4",
  "message": "Profile removed from shortlists."
}
```

---

### 6. Unmatch Connection
**`POST /v1/unmatch`**

Terminates an active mutual match and revokes chat access.

#### 📥 Request Body
```json
{
  "targetUserId": "cmu54acrr00manzks6oded6v7"
}
```

#### 📤 Response (`200 OK`)
```json
{
  "unmatched": true,
  "targetUserId": "cmu54acrr00manzks6oded6v7",
  "message": "Connection unmatched successfully."
}
```

---

### 7. Get Connections Badge Counters
**`GET /v1/connections/counts`**

Returns current count totals to display on UI tabs.

#### 📤 Response (`200 OK`)
```json
{
  "savedCount": 5,
  "sentCount": 2,
  "receivedCount": 3,
  "mutualCount": 8
}
```

---

### 8. Block / Report Member
**`POST /v1/block`**

Permanently blocks member and removes them from all connection categories.

#### 📥 Request Body
```json
{
  "targetUserId": "cmu54acrr00manzks6oded6v4",
  "reason": "Inappropriate messages"
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

## 💻 Web App Redux Integration Snippet

```typescript
// Fetch All Connections Categories
export async function loadConnections() {
  const response = await fetch('/v1/connections', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}

// Unmatch Connection
export async function unmatchUser(targetUserId: string) {
  const response = await fetch('/v1/unmatch', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ targetUserId })
  });
  return await response.json();
}
```

---
*Documentation prepared for AI Marriage Connections Module Integration.*
