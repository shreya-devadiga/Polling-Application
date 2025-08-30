// src/models/Vote.js
import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
  pollId: { type: mongoose.Schema.Types.ObjectId, ref: "Poll", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  optionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  votedAt: { type: Date, default: Date.now }
});


voteSchema.index({ pollId: 1, userId: 1 }, { unique: true });

export default mongoose.model("Vote", voteSchema);
