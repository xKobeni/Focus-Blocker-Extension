import mongoose from "mongoose";

const customBlockPageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    
    // Page content
    title: { type: String, default: "Site Blocked" },
    message: { type: String, default: "This website is on your blocked list during focus sessions." },
    quote: { type: String, default: "Focus is the gateway to thinking clearly, and clear thinking is the gateway to true productivity." },
    
    // Styling
    backgroundColor: { type: String, default: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
    textColor: { type: String, default: "#ffffff" },
    icon: { type: String, default: "🚫" },
    iconType: { 
        type: String, 
        enum: ["emoji", "image", "gif"], 
        default: "emoji" 
    },
    iconUrl: { type: String }, // URL for image or GIF
    
    // Custom redirect URL (optional)
    redirectUrl: { type: String },
    
    // Status
    isActive: { type: Boolean, default: true },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Index
customBlockPageSchema.index({ userId: 1 });

const CustomBlockPage = mongoose.model('CustomBlockPage', customBlockPageSchema);

export default CustomBlockPage;
