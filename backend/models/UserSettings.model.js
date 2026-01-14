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
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);

export default UserSettings;