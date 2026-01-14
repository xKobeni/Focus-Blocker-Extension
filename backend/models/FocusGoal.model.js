import mongoose from "mongoose";

const focusGoalSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    dailyMinutes: Number,
    weeklyMinutes: Number,
    achieved: { type: Boolean, default: false }
});

const FocusGoal = mongoose.model('FocusGoal', focusGoalSchema);

export default FocusGoal;