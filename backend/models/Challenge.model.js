import mongoose from "mongoose";

const challengeSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: true,
        index: true
    },
    
    type: { 
        type: String, 
        enum: ['math', 'memory', 'typing', 'exercise', 'breathing', 'puzzle', 'reaction'],
        required: true,
        index: true
    },
    
    difficulty: { 
        type: Number, 
        min: 1, 
        max: 5,
        default: 2
    },
    
    // Challenge-specific data (question, answer, options, etc.)
    content: {
        question: String,
        correctAnswer: String,
        userAnswer: String,
        options: [String],
        data: mongoose.Schema.Types.Mixed  // Flexible for different challenge types
    },
    
    // Completion details
    completedAt: Date,
    success: { 
        type: Boolean, 
        default: false 
    },
    timeTaken: { 
        type: Number,  // seconds
        default: 0
    },
    
    // Rewards
    xpAwarded: { 
        type: Number, 
        default: 0 
    },
    unlockDuration: { 
        type: Number,  // minutes
        default: 0
    },
    
    // Domain that was unlocked (if successful)
    unlockedDomain: String,
    
    // Session tracking
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FocusSession"
    },
    
    createdAt: { 
        type: Date, 
        default: Date.now,
        index: true
    }
});

// Index for faster queries
challengeSchema.index({ userId: 1, createdAt: -1 });
challengeSchema.index({ userId: 1, type: 1 });
challengeSchema.index({ userId: 1, success: 1 });

const Challenge = mongoose.model('Challenge', challengeSchema);

export default Challenge;
