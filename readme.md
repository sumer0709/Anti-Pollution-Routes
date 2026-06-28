# Anti-Pollution Routes — Backend

A production-grade Node.js backend that helps users find the cleanest commute routes by scoring them against real-time Air Quality Index (AQI) data. Instead of optimizing for distance or speed alone, this system ranks routes by pollution exposure — giving users a healthier way to navigate.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Key Engineering Decisions](#key-engineering-decisions)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [How Pollution Scoring Works](#how-pollution-scoring-works)
- [Background Processing](#background-processing)
- [Security Model](#security-model)
- [Roadmap](#roadmap)

---

## Project Overview

Users save routes they care about — their daily commute, jogging path, cycling route. The system periodically fetches AQI data for each route, calculates a pollution score (0–100, higher is cleaner), and stores it. When a user queries their route, the score is already fresh — no live API wait.

**Core flow:**

```
User saves route (polyline of coordinates)
         ↓
Cron job runs every 15 minutes
         ↓
Samples polyline points (every Nth point — not all 100)
         ↓
Fetches AQI per point via OpenWeather API
         ↓
Redis cache checked first — 30 min TTL per coordinate
         ↓
Calculates average AQI → normalizes to 0–100 score
         ↓
Stores/updates PollutionScore document in MongoDB
```

---

## Architecture

```
HTTP Layer (Express)
    │
    ├── Auth Middleware (JWT verify + DB user lookup)
    ├── Validate Middleware (Joi schema validation)
    └── Controllers (business logic only)
           │
           ├── Route Module
           ├── Pollution Module
           └── Auth Module
                   │
                   ├── MongoDB (Mongoose)
                   ├── Redis (AQI cache)
                   └── OpenWeather API

Background Layer
    └── Cron Scheduler (node-cron)
           └── Pollution Job
                   └── calculatePollutionScore() per route
                           └── AQI Service (Redis → OpenWeather)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB (Mongoose ODM) |
| Cache | Redis (ioredis) |
| Authentication | JWT (access + refresh tokens) |
| Validation | Joi |
| Background Jobs | node-cron |
| External API | OpenWeather Air Pollution API |
| Logging | Winston (custom logger) |
| Security | helmet, bcrypt, httpOnly cookies |

---

## Project Structure

```
backend/
  src/
    config/
      db.js               ← MongoDB connection
      redis.js            ← Redis client with graceful degradation
    cron/
      scheduler.js        ← Registers and starts all cron jobs
      jobs/
        pollution.job.js  ← Processes all routes every 15 minutes
    middleware/
      authenticate.js     ← JWT verification + DB user lookup
      validate.js         ← Reusable Joi validation middleware factory
    modules/
      auth/
        auth.controller.js
        auth.routes.js
        RefreshToken.js
      users/
        user.model.js
        user.controller.js
        user.routes.js
      route/
        route.model.js
        route.validation.js
        route.controller.js
        route.routes.js
      pollution/
        pollution.model.js
        pollution.service.js
        pollution.controller.js
        pollution.routes.js
    services/
      aqi.service.js      ← OpenWeather AQI client with Redis caching
    utils/
      logger.js
      generateToken.js
    validations/
      validations.js      ← Auth Joi schemas
  app.js
  server.js
```

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, receive JWT |
| POST | `/api/auth/logout` | ❌ | Invalidate refresh token |
| POST | `/api/auth/refresh-token` | ❌ | Rotate access token |
| GET | `/api/users/me` | ✅ | Get current user profile |

### Routes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/routes` | ✅ | Create a new route |
| GET | `/api/routes` | ✅ | List user's routes (paginated) |
| GET | `/api/routes/:id` | ✅ | Get single route with full polyline |
| DELETE | `/api/routes/:id` | ✅ | Delete route (ownership verified) |

**Pagination params:** `?page=1&limit=5` (limit clamped to max 50)

**Create route body:**
```json
{
  "startLocation": { "lat": 12.9715, "lng": 77.5945 },
  "endLocation":   { "lat": 13.0012, "lng": 77.5964 },
  "polyline": [
    { "lat": 12.9715, "lng": 77.5945 },
    { "lat": 12.9800, "lng": 77.5950 },
    { "lat": 13.0012, "lng": 77.5964 }
  ],
  "routeType": "commute"
}
```

### Pollution

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/pollution/:routeId/calculate` | ✅ | Calculate pollution score for a route |
| GET | `/api/pollution/test-aqi` | ❌ | Test OpenWeather API connection |

---

## Key Engineering Decisions

### 1. Defense-in-depth Validation

Every request passes through two validation layers:

```
Joi middleware  → rejects invalid data instantly, no DB touched
Mongoose schema → last line of defense for anything that bypasses Joi
```

Joi is stricter than Mongoose — fail fast, fail cheap.

### 2. JWT + DB Lookup on Every Request

The authenticate middleware doesn't just verify the JWT signature — it fetches the user from MongoDB on every request:

```javascript
const user = await User.findById(decoded.userId).select('-password');
if (!user) return res.status(401).json({ message: 'User no longer exists.' });
```

This means deleted or banned users lose access immediately, even with a valid token — rather than waiting for token expiry.

### 3. Mass Assignment Protection

Controllers never do `new Model(req.body)`. Fields are always destructured explicitly:

```javascript
const { startLocation, endLocation, polyline, routeType } = req.body;
const route = new Route({ user: req.user._id, startLocation, endLocation, polyline, routeType });
```

This prevents clients from injecting fields like `user` or `createdAt` into documents.

### 4. Ownership Verification Without Information Leaks

Single-document endpoints query by both `_id` AND `user`:

```javascript
Route.findOne({ _id: req.params.id, user: req.user._id })
```

If nothing is returned — whether the route doesn't exist OR belongs to another user — we return `404`. We never confirm whether a resource exists to an unauthorized requester.

### 5. Redis Cache With Graceful Degradation

Cache failures never block requests:

```javascript
try {
  const cached = await redis.get(cacheKey);
  if (cached) return parseFloat(cached);
} catch (cacheError) {
  logger.error('Redis cache error', cacheError);
  // continues to live API call — cache is a performance layer, not a dependency
}
```

If Redis goes down, the app keeps working — just without caching.

### 6. `Promise.allSettled` for Batch Processing

The background job uses `allSettled` instead of `Promise.all`:

```javascript
const results = await Promise.allSettled(
  routes.map((route) => calculatePollutionScore(route._id))
);
```

One failed route never stops processing the other 99. Each result is individually logged for observability.

### 7. Polyline Sampling

AQI is not called for every coordinate — routes are sampled:

```javascript
const samplePoints = route.polyline.length <= SAMPLE_RATE
  ? route.polyline
  : route.polyline.filter((_, i) => i % SAMPLE_RATE === 0);
```

A 100-point polyline becomes 10 API calls. Reduces OpenWeather quota usage by 90% with minimal accuracy loss — air quality doesn't change meaningfully at 10-meter intervals.

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Redis (local)
- OpenWeather API key (free tier works)

### Installation

```bash
git clone https://github.com/yourusername/anti-pollution-routes.git
cd anti-pollution-routes/backend
npm install
```

### Environment Setup

```bash
cp .env.example .env
# Fill in your values (see Environment Variables section)
```

### Run Development Server

```bash
npm run dev
```

You should see:
```
Connected to MongoDB
Redis connected
Starting cron scheduler...
Cron scheduler started — pollution job every 15 minutes
Server is running on port 5000
```

---

## Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/anti-pollution-routes

# JWT
JWT_SECRET_KEY=your_jwt_secret_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# OpenWeather
OPENWEATHERMAP_API_KEY=your_openweather_api_key_here
```

---

## How Pollution Scoring Works

AQI values from OpenWeather range from 1 to 5:

| AQI | Description |
|---|---|
| 1 | Good |
| 2 | Fair |
| 3 | Moderate |
| 4 | Poor |
| 5 | Very Poor |

The normalization formula inverts this so **higher score = cleaner air**:

```
finalScore = ((5 - averageAQI) / 5) × 100
```

Examples:
```
AQI 1.0 (Good)      → Score 80
AQI 2.0 (Fair)      → Score 60
AQI 3.0 (Moderate)  → Score 40
AQI 5.0 (Very Poor) → Score 0
```

Scores are upserted — one `PollutionScore` document per route, always reflecting the latest calculation.

---

## Background Processing

The cron scheduler starts automatically when the server boots, after the database connection is confirmed:

```javascript
connectDb().then(() => {
  app.listen(PORT, ...);
  startScheduler();       // only starts after DB is ready
});
```

Every 15 minutes:
1. Fetches all routes across all users
2. Samples each polyline
3. Fetches AQI (Redis cache → OpenWeather fallback)
4. Calculates and upserts pollution scores
5. Logs per-route success/failure for observability

---

## Security Model

| Concern | Implementation |
|---|---|
| Password storage | bcrypt hashing |
| Token transport | httpOnly cookies (XSS protection) |
| Token security | sameSite: strict (CSRF protection) |
| HTTPS enforcement | secure: true in production |
| Input validation | Joi on every endpoint |
| Mass assignment | Explicit field destructuring |
| Ownership | All resource endpoints verify user ownership |
| Headers | helmet middleware |
| Identity | JWT verified + DB user lookup on every request |

---

## Roadmap

- [x] Authentication system (register, login, refresh, logout)
- [x] Route CRUD with validation and ownership checks
- [x] AQI service with Redis caching
- [x] Pollution scoring engine (0–100 normalized)
- [x] Cron-based background processing
- [x] RabbitMQ producer/consumer for async job processing
- [ ] Route analysis endpoint (score multiple routes, return best)
- [ ] Centralized error handling middleware
- [ ] Rate limiting on auth and pollution endpoints
- [ ] Graceful server shutdown
- [ ] Health check endpoint
- [ ] API documentation (Swagger)
- [ ] Notification system (email when route AQI improves)

---

## License

MIT