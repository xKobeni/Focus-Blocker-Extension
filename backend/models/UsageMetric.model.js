import mongoose from "mongoose";

const usageMetricSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    
    // Site information
    domain: { type: String, required: true },
    url: { type: String, required: true },
    
    // Time tracking
    visitDate: { type: Date, required: true, default: Date.now },
    timeSpent: { type: Number, default: 0 }, // in seconds
    visitCount: { type: Number, default: 1 },
    
    // Category
    category: {
        type: String,
        enum: ["social", "video", "gaming", "news", "productivity", "shopping", "other"],
        default: "other"
    },
    
    // Metadata
    isBlocked: { type: Boolean, default: false },
    wasBlocked: { type: Boolean, default: false }, // Was blocked when visited
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Index for efficient queries
usageMetricSchema.index({ userId: 1, visitDate: -1 });
usageMetricSchema.index({ userId: 1, domain: 1, visitDate: -1 });

const UsageMetric = mongoose.model('UsageMetric', usageMetricSchema);

export default UsageMetric;
