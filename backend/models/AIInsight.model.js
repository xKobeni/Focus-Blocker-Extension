import mongoose from "mongoose";

const aiInsightSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // reference to the user who the insight is for

    summary: String,
    recommendation: String,
    score: Number,

    createdAt: { type: Date, default: Date.now }

});

const AIInsight = mongoose.model('AIInsight', aiInsightSchema);

export default AIInsight;