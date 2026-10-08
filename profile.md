# AI Marriage App - Profile Tab API Documentation

This document outlines all the API endpoints triggered when navigating and interacting with the **Profile Tab** in the application. It is designed to help web developers implement the same functionality on the web platform.

**Base URL:** `https://kjgspl-aimarriage-backend-nodejs.onrender.com/v1` (or your staging/production base URL)
**Headers Required for all requests:**
- `Content-Type: application/json`
- `Authorization: Bearer <token>`

---

## 1. Load Profile Data (Appears on Profile Tab Open)
When the user opens the Profile tab, the app fetches the current user's profile information, which includes their bio, preferences, settings, and blocked profiles list.

*   **Method:** `GET`
*   **URL:** `/me`
*   **Response:** 
    ```json
    {
      "member": {
        "id": "user_123",
        "name": "Ajay",
        "age": 28,
        "city": "Mumbai",
        "bio": "Developer and tech enthusiast.",
        "education": "B.Tech",
        "occupation": "Software Engineer",
        "interests": ["id1", "id2"],
        "preferences": {
            "gender": "all",
            "minAge": 25,
            "maxAge": 30,
            "city": "All cities"
        },
        "settings": {
            "profileVisibility": "visible",
            "sound": true
        },
        "blockedProfiles": [
            { "id": "blocked_user_id", "name": "Spammer" }
        ]
      }
    }
    ```

---

## 2. Edit Profile & Bio
Updates the user's basic information, biography, and interests.

*   **Method:** `PATCH`
*   **URL:** `/me`
*   **Payload:**
    ```json
    {
      "name": "Ajay",
      "age": 28,
      "bio": "Updated bio text here.",
      "education": "Master's Degree",
      "occupation": "Senior Developer",
      "city": "Mumbai",
      "interests": ["interest_id_1", "interest_id_2"]
    }
    ```
*   **Response:** `200 OK`

---

## 3. Create Bio with AI (AI Assist)
Generates AI-suggested text for the user's biography.

*   **Method:** `POST`
*   **URL:** `/assist`
*   **Payload:**
    ```json
    {
      "kind": "bio",
      "text": "current bio text to improve"
    }
    ```
*   **Response:**
    ```json
    {
      "title": "Personalized Bio Drafts",
      "text": "Primary suggested text here...",
      "suggestions": [
        "Suggestion 1...",
        "Suggestion 2..."
      ]
    }
    ```

---

## 4. Visual Studio / Photos Upload
Uploads a new profile image. Note: The app converts the image to Base64 before sending.

*   **Method:** `POST`
*   **URL:** `/media/photos`
*   **Payload:**
    ```json
    {
      "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
    }
    ```
*   **Response:** `200 OK` (Usually returns the URL of the uploaded image)

---

## 5. Partner Preferences
Updates the user's criteria for discovering potential matches.

*   **Method:** `PATCH`
*   **URL:** `/me`
*   **Payload:**
    ```json
    {
      "preferences": {
        "gender": "woman",
        "city": "Delhi",
        "cities": ["Delhi"],
        "minAge": 24,
        "maxAge": 32,
        "topicPreferences": {
            "children": { "ideal": [], "accepted": [], "stretch": [] }
        },
        "settlementCities": ["Delhi", "Mumbai"],
        "softAnswers": {
            "weekend": ["choice_id_1"]
        }
      }
    }
    ```
*   **Response:** `200 OK`

---

## 6. Privacy & Experience Settings
Controls profile visibility (hidden/visible) and app experience (sounds, practice interactions).

*   **Method:** `PATCH`
*   **URL:** `/me`
*   **Payload:**
    ```json
    {
      "settings": {
        "profileVisibility": "hidden", 
        "practiceInteractions": false,
        "sound": true
      }
    }
    ```
*   **Response:** `200 OK`

---

## 7. Blocked Profiles Management
APIs to block and unblock specific user profiles. 
*(Note: The list of currently blocked profiles is fetched via the `GET /me` API mentioned in Step 1).*

*   **Block a Profile**
    *   **Method:** `POST`
    *   **URL:** `/profiles/{profileId}/block`
    *   **Payload:** `{}`
*   **Unblock a Profile**
    *   **Method:** `POST`
    *   **URL:** `/profiles/{profileId}/unblock`
    *   **Payload:** `{}`
*   **Response:** `200 OK`

---

## 8. Your Boosts
APIs to check boost balance, activate a boost, and view summary.

*   **Get Boost Status & Balance**
    *   **Method:** `GET`
    *   **URL:** `/boosts/status`
*   **Activate a Boost**
    *   **Method:** `POST`
    *   **URL:** `/boosts/activate`
    *   **Payload:** `{"durationMinutes": 60}`
*   **Get Boost Summary (Performance)**
    *   **Method:** `GET`
    *   **URL:** `/boosts/summary`

---

### Summary
**Total API Endpoints used in Profile Tab:** 10 APIs
1. `GET /me` (Load profile & blocked list)
2. `PATCH /me` (Used 3 times for different sections: Edit Bio, Preferences, Privacy)
3. `POST /assist` (AI Bio creation)
4. `POST /media/photos` (Upload Visual Studio images)
5. `POST /profiles/{id}/block` (Block)
6. `POST /profiles/{id}/unblock` (Unblock)
7. `GET /boosts/status` (Boost info)
8. `POST /boosts/activate` (Activate boost)
9. `GET /boosts/summary` (Boost analytics)
