import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    
    // Authentication
    email: { type: String, required: true, unique: true },
    password: { type: String }, // optional if OAuth
    googleId: { type: String, unique: true, sparse: true }, // Google OAuth ID
    name: String,
    
    // Role: "user" for regular users, "admin" for administrators
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
  
    // Gamification
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
  
    // Preferences
    focusGoalMinutes: { type: Number, default: 60 },
    theme: { type: String, default: "dark" },
  
    lastFocusDate: Date,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

export default User;