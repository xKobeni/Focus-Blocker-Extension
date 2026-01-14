import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    title: String,
    description: String,
    icon: String,
  
    unlockedAt: Date
});

const Achievement = mongoose.model('Achievement', achievementSchema);

export default Achievement;