import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    
    // Schedule name
    name: { type: String, required: true },
    
    // Days of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    daysOfWeek: [{ type: Number, min: 0, max: 6 }],
    
    // Time range
    startTime: { type: String, required: true }, // HH:MM format
    endTime: { type: String, required: true }, // HH:MM format
    
    // Timezone (optional, defaults to user's timezone)
    timezone: { type: String, default: "UTC" },
    
    // What to do during this schedule
    action: {
        type: String,
        enum: ["block_all", "block_categories", "block_sites", "time_limit"],
        default: "block_all"
    },
    
    // If action is block_categories or block_sites, specify which
    categories: [{ type: String }],
    siteIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "BlockedSite" }],
    
    // Status
    isActive: { type: Boolean, default: true },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Index for efficient queries
scheduleSchema.index({ userId: 1, isActive: 1 });
scheduleSchema.index({ userId: 1, daysOfWeek: 1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;
