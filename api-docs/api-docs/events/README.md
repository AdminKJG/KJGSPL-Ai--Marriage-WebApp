# Social Events Module — API Documentation

## 📍 Base URL
- **Primary Mobile / Web Prefix:** `http://localhost:8000/v1`

---

## 🎯 Overview & Business Logic

The Social Events module lists curated matrimonial gatherings, singles mixer evenings, cultural celebrations, and community speed-dating sessions (`/v1/events/*`).

### Key Policies:
1. **City-Based Discovery:** Members can filter social events by their home city or preferred settlement cities.
2. **Bookmarking & RSVP:** Members can bookmark upcoming events to track attendance (`POST /v1/events/:id/save`).
3. **Non-Commercial Connected Staging:** In development and staging modes, booking confirmations remain non-commercial (`bookingConfirmed: false`).

---

## 📊 Endpoints Detail

### 1. List Social & Matrimonial Events
**`GET /v1/events`**

- **Full URL:** `http://localhost:8000/v1/events`
- **Auth Guard:** Bearer Access Token (`member`)
- **Query Parameter:** `city` (String, optional) — Filter events by target city (e.g. `?city=Mumbai`).

#### Example Request
```http
GET /v1/events?city=Mumbai HTTP/1.1
Host: localhost:8000
Authorization: Bearer <accessToken>
Accept: application/json
```

#### Response (`200 OK`)
```json
{
  "items": [
    {
      "id": "event_mumbai_coffee_mixer",
      "title": "Artisanal Coffee & Matrimonial Mixer",
      "city": "Mumbai",
      "venue": "Bandra Kurla Complex, Mumbai",
      "description": "An intimate, curated evening for working professionals looking for authentic connection.",
      "category": "Social Mixer",
      "startsAt": "2026-10-15T18:30:00.000Z",
      "active": true,
      "saved": true,
      "bookingConfirmed": false
    },
    {
      "id": "event_mumbai_art_walk",
      "title": "Kala Ghoda Heritage & Art Walk",
      "city": "Mumbai",
      "venue": "Kala Ghoda Art District, Fort",
      "description": "A relaxed Saturday morning exploring architecture, street art, and conversations.",
      "category": "Cultural Walk",
      "startsAt": "2026-10-24T09:00:00.000Z",
      "active": true,
      "saved": false,
      "bookingConfirmed": false
    }
  ]
}
```

---

### 2. Save / Bookmark Event
**`POST /v1/events/:id/save`**

- **Full URL:** `http://localhost:8000/v1/events/:id/save`
- **Auth Guard:** Bearer Access Token (`member`)

#### Request Body
```json
{
  "saved": true
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `saved` | Boolean | Yes | `true` to bookmark/save the event, `false` to remove bookmark. |

#### Response (`200 OK`)
```json
{
  "saved": true,
  "bookingConfirmed": false
}
```

#### Error Responses
- `404 Not Found`: Event ID does not exist or is marked inactive.

---

*Maintained by AI Marriage Engineering Team.*
