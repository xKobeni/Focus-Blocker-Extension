import mongoose from "mongoose";

const focusSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // reference to the user who started the session

    startTime: Date,
    endTime: Date,
    duration: Number, // minutes
  
    distractions: { type: Number, default: 0 },
    interrupted: { type: Boolean, default: false },
  
    source: {
      type: String,
      enum: ["extension", "web"],
      default: "extension"
    },
  
    createdAt: { type: Date, default: Date.now }
});

const FocusSession = mongoose.model('FocusSession', focusSessionSchema);

export default FocusSession;