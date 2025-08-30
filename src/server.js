
import dotenv from "dotenv";
dotenv.config(); 

import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import pollRoutes from "./routes/pollRoutes.js";

import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "*" } });
app.set("io", io);

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));


app.get("/", (req, res) => res.send("Exelon Polls Backend"));
app.use("/api/auth", authRoutes);
app.use("/api/polls", pollRoutes);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// --------------------
// Start server
// --------------------
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();
