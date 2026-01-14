import mongoose from "mongoose";

const blockedSiteSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    url: { type: String, required: true },
    category: {
      type: String,
      enum: ["social", "video", "gaming", "news", "productivity", "shopping", "custom"],
      default: "custom"
    },
  
    isActive: { type: Boolean, default: true },
    
    // Time limit (optional - if set, site is only blocked after time limit is reached)
    hasTimeLimit: { type: Boolean, default: false },
    dailyLimitMinutes: { type: Number, min: 1 },
    
    // Redirect URL (optional - custom redirect when blocked)
    redirectUrl: { type: String },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const BlockedSite = mongoose.model('BlockedSite', blockedSiteSchema);

export default BlockedSite;