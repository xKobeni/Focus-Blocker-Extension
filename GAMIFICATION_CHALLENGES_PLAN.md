# Gamification Challenges - Implementation Plan

## 🎯 Feature Overview
Allow users to complete challenges (math problems, exercises, games) to temporarily unlock blocked sites during focus sessions.

## 🏗️ Architecture

### 1. Challenge Types
```javascript
const CHALLENGE_TYPES = {
  MATH: 'math',                    // Solve math problems
  MEMORY: 'memory',                // Memory card game
  TYPING: 'typing',                // Type a paragraph quickly
  EXERCISE: 'exercise',            // Physical exercises with webcam
  BREATHING: 'breathing',          // Breathing/meditation exercise
  PUZZLE: 'puzzle',                // Simple puzzles/riddles
  REACTION: 'reaction'             // Reaction time game
};
```

### 2. Database Schema

#### Challenge Model (`backend/models/Challenge.model.js`)
```javascript
{
  userId: ObjectId,
  type: String,              // 'math', 'memory', 'exercise', etc.
  difficulty: Number,        // 1-5
  content: Mixed,            // Challenge-specific data
  completedAt: Date,
  success: Boolean,
  timeTaken: Number,        // seconds
  xpAwarded: Number,
  unlockDuration: Number,   // minutes granted
  createdAt: Date
}
```

#### TemporaryUnlock Model (`backend/models/TemporaryUnlock.model.js`)
```javascript
{
  userId: ObjectId,
  domain: String,
  sessionId: ObjectId,
  grantedAt: Date,
  expiresAt: Date,
  duration: Number,         // minutes
  challengeId: ObjectId,
  isActive: Boolean
}
```

#### UserSettings (Add to existing model)
```javascript
{
  // Existing fields...
  challengeSettings: {
    enabled: { type: Boolean, default: false },
    allowedTypes: [String],  // ['math', 'memory', etc.]
    difficulty: { type: Number, default: 2 },
    unlockDuration: { type: Number, default: 15 }, // minutes
    maxUnlocksPerSession: { type: Number, default: 3 },
    requireWebcam: { type: Boolean, default: false }
  }
}
```

### 3. Challenge Generation

#### Math Challenges
```javascript
// Easy: 5 + 3 = ?
// Medium: 12 × 7 = ?
// Hard: 45 ÷ 9 + 23 = ?
// Expert: (15 × 4) - (8 + 3) = ?
```

#### Memory Game
```javascript
// Show grid of cards (4x4, 6x6, 8x8)
// User flips to find matching pairs
// Complete in time limit
```

#### Exercise Challenges (with Webcam)
```javascript
// Jumping jacks: Count 10 reps using pose detection
// Push-ups: Count 5 reps
// Squats: Count 10 reps
// Uses: TensorFlow.js PoseNet or MediaPipe
```

#### Typing Challenge
```javascript
// Type a motivational quote
// Must achieve certain WPM and accuracy
// Example: "Stay focused on your goals..."
```

## 📂 File Structure

```
backend/
├── models/
│   ├── Challenge.model.js
│   └── TemporaryUnlock.model.js
├── controllers/
│   ├── Challenge.controller.js
│   └── TemporaryUnlock.controller.js
├── routes/
│   ├── Challenge.routes.js
│   └── TemporaryUnlock.routes.js
└── utils/
    └── challengeGenerator.js

frontend/
└── src/
    ├── components/
    │   ├── challenges/
    │   │   ├── MathChallenge.jsx
    │   │   ├── MemoryChallenge.jsx
    │   │   ├── ExerciseChallenge.jsx
    │   │   ├── TypingChallenge.jsx
    │   │   └── ChallengeModal.jsx
    │   └── settings/
    │       └── ChallengeSettings.jsx
    └── services/
        └── challengeService.js

extension/
└── src/
    ├── challengeOverlay.js
    └── challenges/
        ├── mathChallenge.js
        ├── memoryChallenge.js
        └── exerciseChallenge.js
```

## 🔄 User Flow

### 1. Setup Flow
```
1. User goes to Settings → Challenge Settings
2. Enable challenges
3. Select challenge types (math, memory, exercise, etc.)
4. Set difficulty level (1-5)
5. Set unlock duration (5-30 minutes)
6. Set max unlocks per session (1-5)
7. Save settings
```

### 2. Challenge Flow
```
1. User starts focus session
2. User visits blocked site (e.g., youtube.com)
3. Instead of just block page, show:
   - "🚫 Site Blocked"
   - "🎯 Complete a challenge to unlock for 15 minutes"
   - [Start Challenge] button
4. User clicks "Start Challenge"
5. Random challenge appears based on settings
6. User completes challenge
7. If successful:
   - Grant XP (10-50 based on difficulty)
   - Unlock site for configured duration
   - Show countdown timer
   - Track unlock in database
8. If failed:
   - Show encouragement message
   - Option to try again (with cooldown)
```

### 3. Unlock Status
```
- Show timer in overlay: "⏱️ Unlocked for 12:34 remaining"
- When timer expires, block site again
- User can complete another challenge (if under max limit)
```

## 🎨 UI/UX Design

### Challenge Modal (Overlay on blocked page)
```
┌────────────────────────────────────────────┐
│  🎯 Challenge: Unlock youtube.com          │
│                                            │
│  Complete this challenge to unlock for     │
│  15 minutes                                │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  Math Challenge (Medium)              │ │
│  │                                        │ │
│  │  What is: 24 × 7 = ?                  │ │
│  │                                        │ │
│  │  [  168  ]                            │ │
│  │                                        │ │
│  │  [Submit Answer]                       │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Remaining Unlocks: 2/3                    │
│                                            │
│  [Cancel]                                  │
└────────────────────────────────────────────┘
```

### Active Unlock Indicator
```
┌────────────────────────────────────────────┐
│  ⏱️ youtube.com unlocked                   │
│  Time remaining: 14:32                     │
│                                            │
│  🎯 Challenge completed!                   │
│  +25 XP earned                             │
│                                            │
│  [Minimize]                                │
└────────────────────────────────────────────┘
```

## 🔧 Implementation Steps

### Phase 1: Backend (Day 1-2)
1. ✅ Create Challenge model
2. ✅ Create TemporaryUnlock model
3. ✅ Add challengeSettings to UserSettings
4. ✅ Create Challenge controller
5. ✅ Create TemporaryUnlock controller
6. ✅ Create challenge generator utility
7. ✅ Create API routes
8. ✅ Add XP rewards for challenges

### Phase 2: Frontend - Basic Challenges (Day 3-4)
1. ✅ Create ChallengeSettings component
2. ✅ Create MathChallenge component
3. ✅ Create MemoryChallenge component
4. ✅ Create TypingChallenge component
5. ✅ Create ChallengeModal component
6. ✅ Create challenge service
7. ✅ Integrate with settings page

### Phase 3: Extension Integration (Day 5)
1. ✅ Modify content.js to show challenge option
2. ✅ Create challenge overlay UI
3. ✅ Implement challenge verification
4. ✅ Add temporary unlock tracking
5. ✅ Add countdown timer display
6. ✅ Sync unlocks with backend

### Phase 4: Advanced Challenges (Day 6-7)
1. ✅ Implement Exercise challenge with webcam
2. ✅ Integrate TensorFlow.js PoseNet
3. ✅ Add rep counting logic
4. ✅ Add breathing exercise
5. ✅ Add reaction time game
6. ✅ Add puzzle challenges

### Phase 5: Polish & Testing (Day 8)
1. ✅ Add animations and transitions
2. ✅ Test all challenge types
3. ✅ Test unlock expiration
4. ✅ Test max unlocks limit
5. ✅ Add error handling
6. ✅ Performance optimization

## 📊 Gamification Enhancements

### XP Rewards
```javascript
const XP_REWARDS = {
  math: {
    easy: 10,
    medium: 20,
    hard: 35,
    expert: 50
  },
  memory: {
    easy: 15,
    medium: 25,
    hard: 40
  },
  exercise: {
    easy: 30,    // Higher reward for physical activity
    medium: 50,
    hard: 75
  },
  typing: {
    easy: 15,
    medium: 25,
    hard: 40
  }
};
```

### Achievements
- "Quick Thinker" - Complete 10 math challenges
- "Memory Master" - Complete 10 memory games
- "Fitness Guru" - Complete 25 exercise challenges
- "Speed Demon" - Complete challenge in under 30 seconds
- "Challenge Champion" - Complete 100 challenges total

### Streak Bonuses
- Complete challenges on consecutive days
- 3-day streak: +10% XP
- 7-day streak: +25% XP
- 30-day streak: +50% XP

## 🔒 Security Considerations

1. **Server-side Verification**
   - Never trust client-side challenge completion
   - Verify challenge answers on backend
   - Rate limit challenge attempts

2. **Anti-Cheat Measures**
   - Track time taken to complete
   - Flag suspiciously fast completions
   - Limit unlock duration
   - Track unlock abuse

3. **Webcam Privacy**
   - Process video locally (no server upload)
   - Show clear indicator when camera is active
   - Allow disabling camera challenges

## 📱 Mobile Considerations

- Touch-friendly challenge interfaces
- Simplified exercise challenges (no webcam)
- Accelerometer-based exercises
- Responsive design for all screens

## 🎓 Educational Value

### Benefits
- Improves mental arithmetic
- Enhances memory
- Encourages physical activity
- Promotes healthy breaks
- Builds discipline

### Analytics to Track
- Challenge completion rates
- Average time per challenge type
- Difficulty progression
- Most popular challenge types
- Impact on focus session duration

## 🚀 Future Enhancements

1. **Multiplayer Challenges**
   - Compete with friends
   - Leaderboards
   - Team challenges

2. **Custom Challenges**
   - Users create their own challenges
   - Share with community
   - Rate and review

3. **AI-Generated Challenges**
   - Personalized difficulty
   - Adaptive learning
   - Contextual challenges

4. **Challenge Packs**
   - Theme-based challenge sets
   - Premium challenges
   - Seasonal events

## 📝 API Endpoints

### Challenge APIs
```
POST   /api/challenges/generate          - Generate new challenge
POST   /api/challenges/:id/verify        - Verify challenge completion
GET    /api/challenges/user/:userId      - Get user's challenge history
GET    /api/challenges/stats             - Get user's challenge stats

POST   /api/temporary-unlocks            - Create temporary unlock
GET    /api/temporary-unlocks/active     - Get active unlocks
DELETE /api/temporary-unlocks/:id        - Revoke unlock
GET    /api/temporary-unlocks/:domain    - Check if domain is unlocked
```

## 💡 Tips for Implementation

1. Start with simple challenges (math, typing)
2. Test thoroughly before adding webcam features
3. Make challenges optional (settings toggle)
4. Provide clear instructions for each challenge
5. Add practice mode (no unlock, just for fun)
6. Show progress and statistics
7. Celebrate achievements with animations
8. Make it rewarding and fun!
