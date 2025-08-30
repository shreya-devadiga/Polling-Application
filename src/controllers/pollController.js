import mongoose from "mongoose";
import Poll from "../models/Poll.js";
import Vote from "../models/Vote.js";


export const createPoll = async (req, res) => {
  try {
    const { question, options, startDate, endDate } = req.body;

    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: "Question and at least 2 options required" });
    }
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: "startDate must be before endDate" });
    }

    const poll = await Poll.create({
      question,
      options: options.map((text) => ({ text, votes: 0 })),
      startDate,
      endDate,
      createdBy: req.user.id
    });

    res.status(201).json(poll);
  } catch (err) {
    console.error("Create poll error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const listPolls = async (req, res) => {
  try {
    const status = req.query.status || "active";
    const now = new Date();
    let filter = {};

    if (status === "active") filter = { startDate: { $lte: now }, endDate: { $gte: now } };
    if (status === "closed") filter = { endDate: { $lt: now } };

    const polls = await Poll.find(filter).sort({ createdAt: -1 }).lean();
    res.json(polls);
  } catch (err) {
    console.error("List polls error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


export const getPollById = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id).lean();
    if (!poll) return res.status(404).json({ message: "Poll not found" });

    const now = new Date();
    const active = poll.startDate <= now && now <= poll.endDate;

    
    if (active && !req.user) {
      poll.options = poll.options.map((o) => ({ _id: o._id, text: o.text }));
    }

    res.json(poll);
  } catch (err) {
    console.error("Get poll error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updatePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: "Poll not found" });
    if (poll.createdBy.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    if (new Date() > poll.endDate) return res.status(400).json({ message: "Poll already closed" });

    const { question, options, startDate, endDate } = req.body;
    if (question) poll.question = question;
    if (startDate) poll.startDate = new Date(startDate);
    if (endDate) poll.endDate = new Date(endDate);

    if (options) {
      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ message: "At least 2 options required" });
      }
      poll.options = options.map((text) => ({ text, votes: 0 }));
    }

    await poll.save();
    res.json(poll);
  } catch (err) {
    console.error("Update poll error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


export const deletePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: "Poll not found" });
    if (poll.createdBy.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    if (new Date() > poll.endDate) return res.status(400).json({ message: "Poll already closed" });

    await Vote.deleteMany({ pollId: poll._id });
    await poll.deleteOne();

    res.json({ message: "Poll deleted" });
  } catch (err) {
    console.error("Delete poll error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


export const votePoll = async (req, res) => {
  try {
    const pollId = req.params.id;
    const userId = req.user.id;
    const { optionId } = req.body;

    if (!optionId) return res.status(400).json({ message: "optionId required" });

    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ message: "Poll not found" });

    const now = new Date();
    if (!(poll.startDate <= now && now <= poll.endDate)) {
      return res.status(400).json({ message: "Poll is not active" });
    }

    const optionExists = poll.options.some((o) => o._id.toString() === optionId);
    if (!optionExists) return res.status(400).json({ message: "Option not found" });

    const alreadyVoted = await Vote.findOne({ pollId, userId });
    if (alreadyVoted) return res.status(400).json({ message: "User has already voted" });

    await Vote.create({ pollId, userId, optionId });
    await Poll.updateOne(
      { _id: pollId, "options._id": optionId },
      { $inc: { "options.$.votes": 1 } }
    );

    res.json({ message: "Vote cast successfully" });
  } catch (err) {
    console.error("Vote error:", err);
    res.status(500).json({ message: "Voting failed", error: err.message });
  }
};

export const getResults = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id).lean();
    if (!poll) return res.status(404).json({ message: "Poll not found" });

    const now = new Date();
    const active = poll.startDate <= now && now <= poll.endDate;

    res.json({
      question: poll.question,
      options: poll.options,
      active,
      message: active ? "Poll is still active, showing live results" : "Poll closed, final results"
    });
  } catch (err) {
    console.error("Get results error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
