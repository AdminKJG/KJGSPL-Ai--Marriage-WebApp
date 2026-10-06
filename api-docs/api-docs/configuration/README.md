# Client Configuration Module — API Documentation

## 📍 Base URL
- **Primary Mobile / Web Prefix:** `http://localhost:8000/v1`

---

## 🎯 Overview & Business Logic

The Configuration module provides client applications with the active platform policies, questionnaire versions, master data lists (geography, scoring weights, matching rules, relationship intentions), active feature flags, cultural field options, and legal disclosures upon app initialization (`GET /v1/config` and `GET /v1/public/platform`).

---

## 📊 Endpoints Detail

### 1. Get Client Configuration & Masters
**`GET /v1/config`**

- **Full URL:** `http://localhost:8000/v1/config`
- **Auth Guard:** Bearer Access Token (`member`)

#### Response (`200 OK`)
```json
{
  "publishedVersion": 1,
  "questionnaireVersion": 1,
  "mode": "connected",
  "demo": false,
  "currency": "USD",
  "paymentsEnabled": true,
  "matchingMode": "deterministic",
  "matchingPolicy": "mobile-deterministic-v2-cultural-preferences",
  "illustrative": false,
  "capabilities": {
    "emailVerified": false,
    "photoUpload": true,
    "eventBookings": false,
    "voiceUpload": false,
    "localLlm": false
  },
  "storyQuestions": [
    {
      "id": "weekend",
      "roundIndex": 0,
      "title": "A Weekend in Your Life",
      "prompt": "What does your ideal Saturday look like?",
      "choices": [
        { "id": "weekend_outdoor", "label": "Outdoors & Activities" },
        { "id": "weekend_quiet", "label": "Quiet & Restorative" }
      ]
    }
  ],
  "culturalFields": {
    "religion": {
      "label": "Religion",
      "options": ["Hindu", "Muslim", "Sikh", "Christian", "Jain", "Buddhist", "Parsi", "Jewish", "Spiritual", "Other"]
    },
    "mother_tongue": {
      "label": "Mother Tongue",
      "options": ["Hindi", "English", "Punjabi", "Bengali", "Gujarati", "Marathi", "Tamil", "Telugu", "Kannada", "Malayalam", "Urdu", "Odia", "Other"]
    },
    "diet": {
      "label": "Dietary Preference",
      "options": ["Vegetarian", "Non-Vegetarian", "Eggetarian", "Vegan", "Jain", "Halal"]
    }
  },
  "masters": {
    "geography": [
      { "id": "city_mumbai", "kind": "city", "label": "Mumbai", "status": "active" },
      { "id": "city_delhi", "kind": "city", "label": "Delhi NCR", "status": "active" },
      { "id": "city_bengaluru", "kind": "city", "label": "Bengaluru", "status": "active" }
    ],
    "scoring": [
      { "id": "values_intent", "weight": 35, "status": "active" },
      { "id": "reciprocal_preferences", "weight": 25, "status": "active" },
      { "id": "lifestyle_family", "weight": 20, "status": "active" },
      { "id": "location_willingness", "weight": 10, "status": "active" },
      { "id": "interests_communication", "weight": 10, "status": "active" }
    ]
  },
  "disclosure": "Connected service. Seeded fictional profiles and events are labelled. Matching uses confirmed choices, not audio or photographs."
}
```

---

### 2. Public Platform Policy Overview
**`GET /v1/public/platform`**

- **Full URL:** `http://localhost:8000/v1/public/platform`
- **Auth Guard:** Public (no authentication required)

#### Response (`200 OK`)
```json
{
  "revision": 1,
  "configuration": {
    "product": "ai_marriage_platform",
    "defaultTimeZone": "Asia/Kolkata",
    "policies": [
      {
        "id": "terms",
        "title": "Terms of Service",
        "version": 1,
        "status": "published"
      },
      {
        "id": "sensitive",
        "title": "Sensitive Cultural Matching Consent Policy",
        "version": 1,
        "status": "published"
      }
    ]
  }
}
```

---

*Maintained by AI Marriage Engineering Team.*
