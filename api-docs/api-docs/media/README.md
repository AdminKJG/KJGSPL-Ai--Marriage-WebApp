# Media & Photo Management Module — API Documentation

## 📍 Base URL
- **Primary Mobile / Web Prefix:** `http://localhost:8000/v1/media`

---

## 🎯 Overview & Business Logic

The Media module provides private profile photograph upload, automatic EXIF metadata stripping, image re-encoding, object storage in MinIO, human moderation review, gallery ordering, and secure byte retrieval (`/v1/media/*`).

### Security & Privacy Architecture:
1. **EXIF & Metadata Stripping:** All uploaded images are processed via `sharp`: GPS location, camera metadata, and orientation tags are stripped; images are resized to at most 1600×1600 (without enlargement) and re-encoded to JPEG at quality 85.
2. **Human Moderation Review:** Uploaded photos initially default to `isApproved: false` and `status: "PENDING"`. Only approved photos are displayed publicly on candidate discovery cards.
3. **Capacity Limit:** Each member can store up to **6 active profile photographs**.
4. **Primary Avatar Selection:** The first uploaded photo is automatically designated as primary (`isMain: true`). Members can reassign the primary avatar or reorder the photo sequence anytime.
5. **No Biometric Identification:** Photographic reviews verify adherence to community safety standards only. No biometric facial recognition or identity claims are performed.

---

## 📊 Endpoints Detail

### 1. Upload Profile Photo
**`POST /v1/media/photos`**

- **Full URL:** `http://localhost:8000/v1/media/photos`
- **Auth Guard:** Bearer Access Token (`member`)
- **Payload Limit:** Max 8.4 MB Base64 string (decoded image size limit: 6 MB).

#### Request Body
```json
{
  "base64": "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP..."
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `base64` | String | Yes | Base64-encoded image bytes (JPG, PNG, or WebP format). |

#### Response (`201 Created`)
```json
{
  "id": "cmu549khk0023nzkse2ykzor8",
  "status": "pending",
  "message": "Uploaded privately for human photo review. No identity verification is implied."
}
```

#### Error Responses
- `400 Bad Request`: Invalid Base64, unsupported image format (e.g. animated GIF, SVG), or size exceeds 6 MB.
- `400 Bad Request`: Member already has 6 active photos (`"You can keep up to six photos. Remove one before adding another."`).
- `503 Service Unavailable`: MinIO photo storage is disabled or unreachable.

---

### 2. Retrieve Photo Image Bytes
**`GET /v1/media/photos/:id`**

- **Full URL:** `http://localhost:8000/v1/media/photos/:id`
- **Auth Guard:** Bearer Access Token (`member` or `admin`)
- **Access Policy:** Members can retrieve their own photos; other members can only view approved, non-private photos.

#### Response (`200 OK`)
```json
{
  "id": "cmu549khk0023nzkse2ykzor8",
  "mimeType": "image/jpeg",
  "base64": "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP..."
}
```

---

### 3. Delete Profile Photo
**`DELETE /v1/media/photos/:id`**

- **Full URL:** `http://localhost:8000/v1/media/photos/:id`
- **Auth Guard:** Bearer Access Token (Owner only)

#### Response (`200 OK`)
```json
{
  "deleted": true
}
```

*(Note: If the deleted photo was the primary avatar, the next available photo is automatically promoted to `isMain: true`)*.

---

### 4. Get User Photo Gallery
**`GET /v1/media/gallery`**

- **Full URL:** `http://localhost:8000/v1/media/gallery`
- **Auth Guard:** Bearer Access Token (`member`)

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "totalCount": 2,
    "maxSlots": 6,
    "mainPhotoId": "cmu549khk0023nzkse2ykzor8",
    "photos": [
      {
        "id": "cmu549khk0023nzkse2ykzor8",
        "slot": 1,
        "isMain": true,
        "isApproved": true,
        "url": "/v1/media/photos/cmu549khk0023nzkse2ykzor8",
        "moderationStatus": "APPROVED",
        "createdAt": "2026-10-02T08:00:00.000Z"
      },
      {
        "id": "cmu549khk0024nzkse2ykzor9",
        "slot": 2,
        "isMain": false,
        "isApproved": false,
        "url": "/v1/media/photos/cmu549khk0024nzkse2ykzor9",
        "moderationStatus": "PENDING",
        "createdAt": "2026-10-02T08:15:00.000Z"
      }
    ]
  }
}
```

---

### 5. Set Primary Avatar Photo
**`PATCH /v1/media/photos/:id/main`**

- **Full URL:** `http://localhost:8000/v1/media/photos/:id/main`
- **Auth Guard:** Bearer Access Token (Owner only)

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Primary profile photo updated successfully",
  "data": {
    "mainPhotoId": "cmu549khk0024nzkse2ykzor9"
  }
}
```

---

### 6. Reorder Gallery Photos
**`PUT /v1/media/photos/reorder`**

- **Full URL:** `http://localhost:8000/v1/media/photos/reorder`
- **Auth Guard:** Bearer Access Token (Owner only)

#### Request Body
```json
{
  "photoIds": [
    "cmu549khk0024nzkse2ykzor9",
    "cmu549khk0023nzkse2ykzor8"
  ]
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `photoIds` | Array\<String\> | Yes | Array of 1 to 6 photo IDs belonging to the authenticated user in the desired sequence. The first ID becomes the main avatar. |

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Gallery photos reordered successfully",
  "data": {
    "mainPhotoId": "cmu549khk0024nzkse2ykzor9",
    "orderedPhotoIds": [
      "cmu549khk0024nzkse2ykzor9",
      "cmu549khk0023nzkse2ykzor8"
    ]
  }
}
```

---

### 7. Moderate / Review Photo (Admin)
**`POST /v1/media/photos/:id/review`**

- **Full URL:** `http://localhost:8000/v1/media/photos/:id/review`
- **Auth Guard:** Bearer Access Token (`superadmin`, `admin`, or `moderator`)

#### Request Body
```json
{
  "approved": true,
  "reason": "Clear, solo face portrait meeting community guidelines."
}
```

#### Response (`200 OK`)
```json
{
  "reviewed": true,
  "verifiedIdentity": false
}
```

---

*Maintained by AI Marriage Engineering Team.*
