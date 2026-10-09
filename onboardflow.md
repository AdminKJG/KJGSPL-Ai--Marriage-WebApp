# AI Marriage App - Onboarding API Flow

This document details the exact API calls made from the moment a user creates an account up to the point they complete the onboarding process (the 7-step wizard). It is designed to help web developers implement the same flow on the web.

**Base URL:** `https://kjgspl-aimarriage-backend-nodejs.onrender.com/v1`

---

## 1. Account Creation (Registration)
When the user clicks "Create account" and submits their basic details.

*   **Method:** `POST`
*   **URL:** `/auth/register`
*   **Payload:**
    ```json
    {
      "email": "user@example.com",
      "password": "SecurePassword123!",
      "name": "Ajay",
      "dateOfBirth": "1995-05-20",
      "adultConfirmed": true
    }
    ```
*   **Response:** `200 OK` or `201 Created`

## 2. Sign In (Login)
Immediately after registration, the app logs the user in to retrieve the `accessToken` which is used for all subsequent secure requests.

*   **Method:** `POST`
*   **URL:** `/auth/login`
*   **Payload:**
    ```json
    {
      "email": "user@example.com",
      "password": "SecurePassword123!"
    }
    ```
*   **Response:**
    ```json
    {
      "accessToken": "eyJhbGc...",
      "refreshToken": "def456...",
      "user": {
        "id": "123",
        "role": "member"
      }
    }
    ```
*(Note: For all APIs below, pass the `accessToken` in the `Authorization: Bearer <token>` header).*

---

## 3. The 7-Step Onboarding Wizard (UI Flow)
The mobile app presents 7 steps to the user. 
**Crucial Note for Web Implementation:** The app **DOES NOT** call the backend API on every "Next" button click. Instead, it saves the data locally (draft state) as the user progresses through steps 1 to 7. 

The only exception during these steps is the **City Search (Public API)**, which is called when the user types a city name in Step 3 (Their City) and Step 6 (Partner City).

### Public API: City Search (Komoot Photon)
Triggered when the user types 2 or more characters in the city autocomplete fields.

*   **Method:** `GET`
*   **URL:** `https://photon.komoot.io/api/?q={USER_INPUT}&osm_tag=place:city&limit=5&lang=en`
*   **Headers:** No Auth required. Just `User-Agent`.
*   **Response:** Returns a GeoJSON object with a `features` array containing matched cities.

---

## 4. Final Submission: "Begin your discovery"
When the user reaches the final step (Step 7) and clicks the final submit button, the app aggregates all the locally saved data and fires two backend APIs.

### A. Upload Profile Photo (If the user selected one)
*   **Method:** `POST`
*   **URL:** `/media/photos`
*   **Payload:**
    ```json
    {
      "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
    }
    ```

### B. Save All Onboarding Data
The app takes all the data from the 7 steps and saves it to the user's profile in one large PATCH request.

*   **Method:** `PATCH`
*   **URL:** `/me`
*   **Payload:**
    ```json
    {
      "name": "Ajay",
      "age": 28,
      "city": "Mumbai, India",
      "bio": "A short bio written by the user...",
      "education": "B.Tech",
      "occupation": "Software Engineer",
      "adultConfirmed": true,
      "dateOfBirth": "1995-05-20",
      "gender": "man",
      "matchingConsent": true,
      "onboardingComplete": true,
      "interests": ["interest_id_1", "interest_id_2"],
      "settings": {
        "profileVisibility": "visible"
      },
      "preferences": {
        "city": "All cities",
        "cities": [],
        "minAge": 25,
        "maxAge": 32,
        "settlementCities": ["Delhi, India", "Pune, India"]
      },
      "versionedAnswers": {
        "questionnaireVersion": 1,
        "answers": {
            "intentions": ["long_term"],
            "rhythm": "Early mornings"
        }
      },
      "onboarding": {
        "complete": true,
        "questionnaireVersion": 1,
        "answers": {
            "name": "Ajay",
            "age": "28",
            "city": "Mumbai, India",
            "rhythm": "Early mornings"
        },
        "privateAnswers": ["family", "communication", "boundaries"]
      }
    }
    ```
*   **Response:** `200 OK`

---

### Flow Summary for Web Developers:
1. Call `POST /auth/register` to create the account.
2. Call `POST /auth/login` to get the access token.
3. Build the 7-step UI, saving state in a React State / Redux / LocalStorage object as the user clicks "Next".
4. Use the public `photon.komoot.io` API for city lookups.
5. On the final step, call `POST /media/photos` (if an image is selected).
6. Call `PATCH /me` with the massive aggregated payload to save everything and mark `onboardingComplete: true`.
