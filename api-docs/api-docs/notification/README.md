# Notification & In-App Inbox Module — API Documentation

## 📍 Base URLs
- **Mobile / Web Active Contract:** `http://localhost:8000/v1`
- **Legacy REST Prefix (when enabled):** `http://localhost:8000/api`

---

## 🎯 Overview & Business Logic

The Notification module provides members with an in-app notification inbox (bell feed), unread badge counts, single/bulk read markers, and multi-channel delivery rules (In-App, Push, Email, SMS).

---

## 📊 Endpoints Detail

### 1. Fetch In-App Notification Feed
**`GET /v1/notifications`** (or `GET /api/notifications`)

- **Full URL:** `http://localhost:8000/v1/notifications`
- **Auth Guard:** Bearer Access Token (`member`)
- **Query Parameters:**
  - `page` *(optional, integer, default: 1)*: 1-based page number.
  - `limit` *(optional, integer, default: 20, max: 100)*: Items per page.
  - `unreadOnly` *(optional, boolean, default: false)*: Set to `true` to fetch only unread notifications.
  - `type` *(optional, string)*: Filter by notification category (`interest`, `match`, `chat`, `system`, `alert`).

#### Example Request
```http
GET /v1/notifications?page=1&limit=20&unreadOnly=false HTTP/1.1
Host: localhost:8000
Authorization: Bearer <accessToken>
Accept: application/json
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "cm8notif001xyz",
        "empID": "cmu549khj001znzksahfvcjqp",
        "type": "interest",
        "message": "Ananya Sharma has sent you an expression of interest!",
        "sentBy": null,
        "emailSubject": "New interest received on AI Marriage",
        "emailText": "Ananya Sharma has sent you an expression of interest!",
        "emailBodyHtml": null,
        "actionUrl": "/connections",
        "channel": "in-app",
        "read": false,
        "isScheduled": false,
        "scheduledAt": null,
        "metadata": {
          "senderId": "cmu54acrr00manzks6oded6v4",
          "senderName": "Ananya Sharma"
        },
        "createdAt": "2026-10-02T10:30:00.000Z",
        "updatedAt": "2026-10-02T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalCount": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    },
    "unreadCount": 1
  }
}
```

---

### 2. Mark Single Notification as Read
**`PATCH /v1/notifications/:id/read`** (or `PATCH /api/notifications/:id/read`)

- **Full URL:** `http://localhost:8000/v1/notifications/:id/read`
- **Auth Guard:** Bearer Access Token (`member`)

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "cm8notif001xyz",
    "empID": "cmu549khj001znzksahfvcjqp",
    "read": true,
    "updatedAt": "2026-10-02T10:35:00.000Z"
  }
}
```

---

### 3. Mark All Notifications as Read
**`PATCH /v1/notifications/read-all`** (or `PATCH /api/notifications/read-all`)

- **Full URL:** `http://localhost:8000/v1/notifications/read-all`
- **Auth Guard:** Bearer Access Token (`member`)

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "updatedCount": 4
}
```

---

### 4. Delete Notification
**`DELETE /v1/notifications/:id`** (or `DELETE /api/notifications/:id`)

- **Full URL:** `http://localhost:8000/v1/notifications/:id`
- **Auth Guard:** Bearer Access Token (`member`)

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

### 5. Update Channel Preferences & Quiet Hours
**`PATCH /v1/account-centre/preferences`**

- **Full URL:** `http://localhost:8000/v1/account-centre/preferences`
- **Auth Guard:** Bearer Access Token (`member`)

#### Request Body
```json
{
  "frequency": "daily",
  "quietHours": {
    "enabled": true,
    "start": "22:00",
    "end": "08:00"
  },
  "channels": {
    "email": true,
    "push": true,
    "sms": false
  }
}
```

#### Response (`200 OK`)
```json
{
  "saved": true,
  "preferences": {
    "frequency": "daily",
    "quietHours": { "enabled": true, "start": "22:00", "end": "08:00" },
    "channels": { "email": true, "push": true, "sms": false }
  }
}
```

---

### 6. Toggle Profile Notifications
**`PATCH /v1/me`**

- **Full URL:** `http://localhost:8000/v1/me`
- **Auth Guard:** Bearer Access Token (`member`)

#### Request Body
```json
{
  "settings": {
    "notifications": true
  }
}
```

---

*Maintained by AI Marriage Engineering Team.*
