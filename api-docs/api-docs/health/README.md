# System Health & Readiness Module — API Documentation

## 📍 Base URL
- **Root URL:** `http://localhost:8000`

---

## 🎯 Overview & Business Logic

The Health module provides liveness and readiness monitoring probes for load balancers, container orchestrators (Docker, Kubernetes), uptime pingers, and client connectivity pre-checks.

---

## 📊 Endpoints Detail

### 1. Root API Status Probe
**`GET /`**

- **Full URL:** `http://localhost:8000/`
- **Auth Guard:** Public (no authentication required)

#### Response (`200 OK`)
```json
{
  "status": "online",
  "message": "AI Marriage Backend API is running successfully",
  "service": "ai-marriage-backend",
  "version": "1.0.0",
  "timestamp": "2026-10-02T12:00:00.000Z"
}
```

---

### 2. Process Liveness Check
**`GET /health`**

- **Full URL:** `http://localhost:8000/health`
- **Auth Guard:** Public
- **Purpose:** Fast process heartbeat probe (excluded from request log noise).

#### Response (`200 OK`)
```json
{
  "status": "healthy",
  "uptime": 3600.42,
  "timestamp": "2026-10-02T12:00:00.000Z"
}
```

---

### 3. Mobile v1 Contract & Database Ping
**`GET /v1/health`**

- **Full URL:** `http://localhost:8000/v1/health`
- **Auth Guard:** Public
- **Purpose:** Verifies live PostgreSQL query execution (`SELECT 1`) and `/v1` mobile router availability.

#### Response (`200 OK`)
```json
{
  "ok": true,
  "mode": "connected",
  "service": "ai-marriage-node",
  "contract": "mobile-v1"
}
```

---

### 4. Infrastructure Readiness Probe (DB + Redis)
**`GET /ready`** *(Active when `ENABLE_LEGACY_API=true`)*

- **Full URL:** `http://localhost:8000/ready`
- **Auth Guard:** Public
- **Purpose:** Evaluates parallel connectivity to PostgreSQL database and Redis cluster.

#### Response (`200 OK — Healthy`)
```json
{
  "status": "ready",
  "components": {
    "db": "up",
    "redis": "up"
  }
}
```

#### Response (`503 Service Unavailable — Degraded`)
```json
{
  "status": "degraded",
  "components": {
    "db": "up",
    "redis": "down"
  }
}
```

---

*Maintained by AI Marriage Engineering Team.*
