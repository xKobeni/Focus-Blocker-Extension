import mongoose from "mongoose";

const timeLimitSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    
    // Site information
    domain: { type: String, required: true },
    url: { type: String, required: true },
    
    // Time limit settings
    dailyLimitMinutes: { type: Number, required: true, min: 1 }, // Daily time limit in minutes
    resetTime: { type: String, default: "00:00" }, // Time when limit resets (HH:MM format)
    
    // Tracking
    timeUsedToday: { type: Number, default: 0 }, // Time used today in seconds
    lastResetDate: { type: Date, default: Date.now },
    
    // Behavior when limit is reached
    action: {
        type: String,
        enum: ["block", "warn"], // Block completely or just warn
        default: "block"
    },
    
    // Status
    isActive: { type: Boolean, default: true },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Index for efficient queries
timeLimitSchema.index({ userId: 1, domain: 1 });
timeLimitSchema.index({ userId: 1, isActive: 1 });

const TimeLimit = mongoose.model('TimeLimit', timeLimitSchema);

export default TimeLimit;
