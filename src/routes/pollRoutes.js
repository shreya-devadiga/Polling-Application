
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createPoll,
  listPolls,
  getPollById,
  updatePoll,
  deletePoll,
  votePoll,
  getResults
} from "../controllers/pollController.js";

const router = express.Router();

router.get("/", listPolls);
router.get("/:id", getPollById);
router.get("/:id/results", getResults);
router.use(protect);  
router.post("/", createPoll);
router.put("/:id", updatePoll);
router.delete("/:id", deletePoll);
router.post("/:id/vote", votePoll);

export default router;
