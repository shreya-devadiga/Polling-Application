import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    votes: { type: Number, default: 0 }
  },
  { _id: true } // keep _id for options
);

const pollSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [optionSchema], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
});

pollSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.model("Poll", pollSchema);
