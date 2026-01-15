# Challenge System API Reference

Quick reference for all challenge and unlock endpoints.

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints require Bearer token in Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Challenge Endpoints

### 1. Generate New Challenge
**POST** `/challenges/generate`

Generate a random challenge based on user settings.

**Body:**
```json
{
  "userId": "USER_ID",
  "type": "math",           // Optional: math, memory, typing, exercise, breathing, reaction
  "domain": "youtube.com"   // Domain to unlock if successful
}
```

**Response:**
```json
{
  "id": "challenge_id",
  "type": "math",
  "difficulty": 2,
  "content": {
    "question": "12 × 7"
    // correctAnswer NOT included for security
  },
  "xpReward": 20,
  "unlockDuration": 15,
  "remainingUnlocks": 2
}
```

**Errors:**
- `400` - Missing userId
- `403` - Challenges not enabled or max unlocks reached
- `429` - Cooldown period not elapsed

---

### 2. Verify Challenge
**POST** `/challenges/:id/verify`

Submit answer and verify challenge completion.

**Body:**
```json
{
  "userAnswer": "84",
  "timeTaken": 15  // seconds
}
```

**Response (Success):**
```json
{
  "success": true,
  "xpAwarded": 20,
  "unlockDuration": 15,
  "expiresAt": "2026-01-15T12:45:00.000Z",
  "temporaryUnlockId": "unlock_id",
  "message": "Challenge completed successfully!"
}
```

**Response (Failure):**
```json
{
  "success": false,
  "message": "Challenge failed. Try again!"
}
```

---

### 3. Get User Challenges
**GET** `/challenges/user/:userId`

Get challenge history for a user.

**Query Parameters:**
- `limit` - Results per page (default: 50)
- `skip` - Pagination offset (default: 0)
- `type` - Filter by challenge type
- `success` - Filter by success status (true/false)

**Response:**
```json
{
  "challenges": [
    {
      "_id": "challenge_id",
      "userId": "user_id",
      "type": "math",
      "difficulty": 2,
      "success": true,
      "timeTaken": 15,
      "xpAwarded": 20,
      "completedAt": "2026-01-15T12:30:00.000Z",
      "sessionId": {
        "startTime": "2026-01-15T12:00:00.000Z"
      }
    }
  ],
  "total": 42,
  "limit": 50,
  "skip": 0
}
```

---

### 4. Get Challenge Stats
**GET** `/challenges/stats`

Get user's challenge statistics.

**Response:**
```json
{
  "totalChallenges": 42,
  "successfulChallenges": 35,
  "failedChallenges": 7,
  "successRate": 83.3,
  "totalXP": 820,
  "recentChallenges": 12,
  "byType": [
    {
      "_id": "math",
      "total": 20,
      "successful": 18,
      "totalXP": 360,
      "avgTime": 18.5
    }
  ]
}
```

---

## Temporary Unlock Endpoints

### 1. Get Active Unlocks
**GET** `/temporary-unlocks/active`

Get all currently active unlocks for the user.

**Response:**
```json
[
  {
    "_id": "unlock_id",
    "userId": "user_id",
    "domain": "youtube.com",
    "grantedAt": "2026-01-15T12:30:00.000Z",
    "expiresAt": "2026-01-15T12:45:00.000Z",
    "duration": 15,
    "isActive": true,
    "wasUsed": true,
    "firstAccessedAt": "2026-01-15T12:32:00.000Z",
    "challengeId": {
      "type": "math",
      "difficulty": 2,
      "xpAwarded": 20
    }
  }
]
```

---

### 2. Check Domain Unlock
**GET** `/temporary-unlocks/check/:domain`

Check if a specific domain is currently unlocked.

**Example:** `/temporary-unlocks/check/youtube.com`

**Response (Unlocked):**
```json
{
  "isUnlocked": true,
  "unlock": {
    "id": "unlock_id",
    "domain": "youtube.com",
    "expiresAt": "2026-01-15T12:45:00.000Z",
    "remainingMinutes": 14,
    "remainingSeconds": 32,
    "grantedAt": "2026-01-15T12:30:00.000Z"
  }
}
```

**Response (Locked):**
```json
{
  "isUnlocked": false,
  "message": "Domain is not currently unlocked"
}
```

---

### 3. Get Session Unlocks
**GET** `/temporary-unlocks/session`

Get all unlocks for the current active session.

**Response:**
```json
{
  "sessionId": "session_id",
  "total": 3,
  "active": 1,
  "expired": 2,
  "unlocks": [
    {
      "_id": "unlock_id",
      "domain": "youtube.com",
      "isActive": true,
      "expiresAt": "2026-01-15T12:45:00.000Z"
    }
  ]
}
```

---

### 4. Get Unlock History
**GET** `/temporary-unlocks/history`

Get full unlock history for the user.

**Query Parameters:**
- `limit` - Results per page (default: 50)
- `skip` - Pagination offset (default: 0)

**Response:**
```json
{
  "unlocks": [
    {
      "_id": "unlock_id",
      "domain": "youtube.com",
      "grantedAt": "2026-01-15T12:30:00.000Z",
      "expiresAt": "2026-01-15T12:45:00.000Z",
      "isActive": false,
      "wasUsed": true,
      "challengeId": {
        "type": "math",
        "success": true
      }
    }
  ],
  "total": 25,
  "limit": 50,
  "skip": 0
}
```

---

### 5. Revoke Unlock
**DELETE** `/temporary-unlocks/:id`

Manually end an active unlock early.

**Response:**
```json
{
  "message": "Unlock revoked successfully",
  "unlock": {
    "_id": "unlock_id",
    "isActive": false,
    "revokedAt": "2026-01-15T12:35:00.000Z",
    "revokedBy": "user"
  }
}
```

---

### 6. Cleanup Expired (Admin)
**POST** `/temporary-unlocks/cleanup`

Cleanup all expired unlocks (cron/admin use).

**Response:**
```json
{
  "message": "Expired unlocks cleaned up successfully",
  "modifiedCount": 15
}
```

---

## Challenge Types

### Available Types:
- `math` - Mathematical problems
- `memory` - Memory card game
- `typing` - Typing speed test
- `exercise` - Physical exercises
- `breathing` - Breathing exercises
- `puzzle` - Logic puzzles (future)
- `reaction` - Reaction time test (future)

### Difficulty Levels:
- `1` - Easy
- `2` - Medium (default)
- `3` - Hard
- `4` - Expert
- `5` - Master

---

## Example Flow

### 1. User Settings
First, enable challenges in user settings:
```json
{
  "challengeSettings": {
    "enabled": true,
    "allowedTypes": ["math", "memory", "typing"],
    "difficulty": 2,
    "unlockDuration": 15,
    "maxUnlocksPerSession": 3
  }
}
```

### 2. Generate Challenge
When user visits blocked site:
```
POST /api/challenges/generate
Body: { userId, type: "math", domain: "youtube.com" }
```

### 3. Complete Challenge
User solves the challenge:
```
POST /api/challenges/CHALLENGE_ID/verify
Body: { userAnswer: "84", timeTaken: 15 }
```

### 4. Check Unlock
Extension checks if domain is unlocked:
```
GET /api/temporary-unlocks/check/youtube.com
```

### 5. Access Site
If unlocked, allow access and show timer.

### 6. Expiration
When timer expires, unlock automatically deactivates.

---

## Error Codes

- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (no/invalid token)
- `403` - Forbidden (challenges disabled, max unlocks reached)
- `404` - Not Found (challenge/unlock not found)
- `429` - Too Many Requests (cooldown period)
- `500` - Server Error

---

## Rate Limiting

- Global API rate limit: Applied to all `/api/*` routes
- Challenge cooldown: Configurable per user (default 5 minutes)
- Max unlocks per session: Configurable (default 3)

---

## Notes

1. All timestamps in ISO 8601 format
2. Domains automatically normalized (lowercase, www removed)
3. Expired unlocks automatically cleaned up on query
4. Challenge answers never sent to client
5. All operations require active focus session
6. XP awarded only on successful completion
