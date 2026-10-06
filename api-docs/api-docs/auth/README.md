# Authentication & Session Module — API Documentation

## 📍 Base URL
- **Mobile / Web Active Contract:** `http://localhost:8000/v1/auth`
- **Legacy REST Prefix (when enabled):** `http://localhost:8000/api/auth`

---

## 🎯 Overview & Security Architecture

The Authentication module provides secure user signup, credential validation, TOTP multi-factor authentication (MFA), session tokens, and single-use refresh token rotation.

### Core Security Rules:
1. **Adult Confirmation Required:** Registration strictly requires confirming adulthood (`adultConfirmed: true`) and age between 18 and 99 years calculated from `dateOfBirth`.
2. **Password Security:** Minimum 12 characters, hashed using Argon2id.
3. **Dual-Token Session Architecture:**
   - **Access Token:** Short-lived JWT (15-minute expiration) used in the `Authorization: Bearer <token>` header for all protected endpoints.
   - **Refresh Token:** Rotating cryptographically secure random token (30-day expiration).
4. **Single-Use Refresh Token Rotation:** Every call to `POST /v1/auth/refresh` issues a brand-new token pair and invalidates the previous refresh token. Replay attempts on a previously consumed token immediately revoke the entire session family to defend against token theft.
5. **Multi-Factor Authentication (TOTP):** When `mfaEnabled` is true, login requires a 6-digit TOTP code (`mfaCode`).
6. **Brute-Force Rate Limiting:** 30 requests per 15-minute window per IP. Accounts are temporarily locked for 15 minutes after 5 consecutive failed login attempts.

---

## 📊 Active `/v1/auth` Endpoints Detail

### 1. Member Registration
**`POST /v1/auth/register`**

- **Full URL:** `http://localhost:8000/v1/auth/register`
- **Auth Guard:** Public
- **Rate Limit:** 30 req / 15 min

#### Request Headers
```http
Content-Type: application/json
```

#### Request Body
```json
{
  "name": "Rohan Verma",
  "email": "rohan.verma@example.com",
  "password": "SuperSecretPassword123!",
  "dateOfBirth": "1998-05-15",
  "adultConfirmed": true
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | Yes | Full name (2 to 80 characters). |
| `email` | String | Yes | Valid email address (max 254 characters, trimmed & lowercased). |
| `password` | String | Yes | Strong password (12 to 128 characters). |
| `dateOfBirth` | String | Yes | Date string in `YYYY-MM-DD` ISO format. Age must be between 18 and 99. |
| `adultConfirmed` | Boolean | Yes | Must be literal `true`. |
| `mfaCode` | String | No | Optional 6-digit TOTP code. |

#### Response (`201 Created`)
```json
{
  "registered": true,
  "userId": "cmu549khj001znzksahfvcjqp",
  "message": "Account created. Sign in to finish your profile.",
  "verified": false
}
```

#### Error Responses
- `400 Bad Request`: Underage birth date, invalid email format, short password (<12 characters), or `adultConfirmed` is not `true`.
- `409 Conflict`: Email address is already registered.

---

### 2. Member Login
**`POST /v1/auth/login`**

- **Full URL:** `http://localhost:8000/v1/auth/login`
- **Auth Guard:** Public
- **Rate Limit:** 30 req / 15 min (locks for 15 min after 5 consecutive failed attempts)

#### Request Body
```json
{
  "email": "rohan.verma@example.com",
  "password": "SuperSecretPassword123!",
  "mfaCode": "123456"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | String | Yes | Registered account email address. |
| `password` | String | Yes | Account password. |
| `mfaCode` | String | No | 6-digit TOTP code (required if MFA is enabled on the account). |

#### Response (`200 OK`)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "cmu549khj001znzksahfvcjqp",
    "name": "Rohan Verma",
    "role": "member"
  }
}
```

> **Note on Roles:**
> Roles map as follows:
> - `user` → `"member"`
> - `admin` → `"operations_admin"`
> - `moderator` → `"moderator"`
> - `superadmin` → `"super_admin"`

#### Error Responses
- `401 Unauthorized`: Invalid email or password, or missing/invalid TOTP `mfaCode`.
- `429 Too Many Requests`: Account temporarily locked due to 5+ consecutive failed login attempts.

---

### 3. Session Refresh (Single-Use Token Rotation)
**`POST /v1/auth/refresh`**

- **Full URL:** `http://localhost:8000/v1/auth/refresh`
- **Auth Guard:** Public (requires valid `refreshToken`)

#### Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `refreshToken` | String | Yes | Valid active refresh token (20 to 4000 characters). |

#### Response (`200 OK`)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new...",
  "expiresIn": 900
}
```

#### Error Responses
- `401 Unauthorized`: Expired, invalid, or replayed refresh token. (If a previously rotated token is replayed, the entire session family is revoked for security).

---

### 4. Active Session & Role Resolution
**`GET /v1/auth/session`**

- **Full URL:** `http://localhost:8000/v1/auth/session`
- **Auth Guard:** Bearer Access Token (`Authorization: Bearer <accessToken>`)

#### Response (`200 OK`)
```json
{
  "user": {
    "id": "cmu549khj001znzksahfvcjqp",
    "role": "member"
  }
}
```

#### Error Responses
- `401 Unauthorized`: Missing or invalid session token.

---

### 5. Logout
**`POST /v1/auth/logout`**

- **Full URL:** `http://localhost:8000/v1/auth/logout`
- **Auth Guard:** Bearer Access Token (`Authorization: Bearer <accessToken>`)

#### Response (`200 OK`)
```json
{
  "signedOut": true
}
```

---

## 🛠️ Legacy / Extended Auth Endpoints (`/api/auth/*`)

*When `ENABLE_LEGACY_API=true` is enabled in backend environment:*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Legacy registration. |
| `GET` | `/api/auth/verify-email?token=...` | Email token verification. |
| `POST` | `/api/auth/login` | Legacy email/password login. |
| `POST` | `/api/auth/forgot-password` | Initiates password reset email. |
| `POST` | `/api/auth/reset-password` | Sets new password using reset token. |
| `POST` | `/api/auth/change-password` | Updates password for authenticated user. |
| `POST` | `/api/auth/otp/send` | Sends mobile/email OTP. |
| `POST` | `/api/auth/otp/verify` | Verifies OTP code. |
| `POST` | `/api/auth/mfa/setup` | Generates TOTP secret and QR code for authenticator apps. |
| `POST` | `/api/auth/mfa/verify` | Confirms initial TOTP setup with 6-digit code. |
| `POST` | `/api/auth/google/credential` | Exchanges Google OAuth JWT id_token for backend session. |
| `GET` | `/api/auth/google` | Initiates Passport Google OAuth redirect. |

---

*Maintained by AI Marriage Engineering Team.*
