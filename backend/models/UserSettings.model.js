import mongoose from "mongoose";

const userSettingsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    strictMode: { type: Boolean, default: false },
    allowOverrides: { type: Boolean, default: true },
    breakInterval: { type: Number, default: 25 },
    
    // Password protection for settings
    settingsPassword: { type: String }, // Hashed password
    requirePasswordForSettings: { type: Boolean, default: false },
    
    // Uninstall prevention (extension only)
    preventUninstall: { type: Boolean, default: false },
    
    // Focus mode settings
    focusModeDuration: { type: Number, default: 25 }, // minutes
    focusModeEnabled: { type: Boolean, default: false },
    
    // Analytics preferences
    trackUsage: { type: Boolean, default: true },
    
    // Challenge settings for gamification unlocks
    challengeSettings: {
        enabled: { type: Boolean, default: false },
        allowedTypes: { 
            type: [String], 
            default: ['math', 'memory', 'typing'],
            enum: ['math', 'memory', 'typing', 'exercise', 'breathing', 'puzzle', 'reaction']
        },
        difficulty: { 
            type: Number, 
            min: 1, 
            max: 5, 
            default: 2 
        },
        unlockDuration: { 
            type: Number,  // minutes
            min: 5, 
            max: 60, 
            default: 15 
        },
        maxUnlocksPerSession: { 
            type: Number, 
            min: 1, 
            max: 10, 
            default: 3 
        },
        requireWebcam: { 
            type: Boolean, 
            default: false 
        },
        cooldownMinutes: {
            type: Number,  // minutes between challenge attempts
            min: 0,
            max: 30,
            default: 5
        }
    },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);

export default UserSettings;