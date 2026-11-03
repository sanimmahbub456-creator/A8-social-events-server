import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db";
import eventRoutes from "./routes/eventRoutes";
import authRoutes from "./routes/authRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000").split(",");

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.send("Social Development Events Platform server is running");
});

app.use(authRoutes);
app.use(eventRoutes);

app.use((_req, res) => {
  res.status(404).send({ message: "Route not found" });
});

const start = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`🚀 Server listening on port ${port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();
