import mongoose from "mongoose";

const temporaryUnlockSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: true,
        index: true
    },
    
    domain: { 
        type: String, 
        required: true,
        lowercase: true,
        trim: true
    },
    
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FocusSession",
        required: true
    },
    
    challengeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Challenge",
        required: true
    },
    
    grantedAt: { 
        type: Date, 
        default: Date.now,
        index: true
    },
    
    expiresAt: { 
        type: Date, 
        required: true,
        index: true
    },
    
    duration: { 
        type: Number,  // minutes
        required: true
    },
    
    isActive: { 
        type: Boolean, 
        default: true,
        index: true
    },
    
    // Track if the unlock was used
    wasUsed: {
        type: Boolean,
        default: false
    },
    
    // Track when the user actually visited the unlocked site
    firstAccessedAt: Date,
    lastAccessedAt: Date,
    
    // Revocation info (if manually ended)
    revokedAt: Date,
    revokedBy: String  // 'user', 'system', 'session_end', etc.
});

// Compound index for efficient queries
temporaryUnlockSchema.index({ userId: 1, domain: 1, isActive: 1 });
temporaryUnlockSchema.index({ userId: 1, sessionId: 1, isActive: 1 });
temporaryUnlockSchema.index({ expiresAt: 1, isActive: 1 });

// Virtual to check if unlock is still valid
temporaryUnlockSchema.virtual('isValid').get(function() {
    return this.isActive && new Date() < this.expiresAt;
});

// Method to revoke unlock
temporaryUnlockSchema.methods.revoke = function(reason = 'user') {
    this.isActive = false;
    this.revokedAt = new Date();
    this.revokedBy = reason;
    return this.save();
};

// Static method to get active unlock for domain
temporaryUnlockSchema.statics.getActiveUnlock = function(userId, domain) {
    return this.findOne({
        userId,
        domain: domain.toLowerCase(),
        isActive: true,
        expiresAt: { $gt: new Date() }
    });
};

// Static method to cleanup expired unlocks
temporaryUnlockSchema.statics.cleanupExpired = async function() {
    const result = await this.updateMany(
        {
            isActive: true,
            expiresAt: { $lt: new Date() }
        },
        {
            $set: {
                isActive: false,
                revokedAt: new Date(),
                revokedBy: 'expired'
            }
        }
    );
    return result;
};

const TemporaryUnlock = mongoose.model('TemporaryUnlock', temporaryUnlockSchema);

export default TemporaryUnlock;
