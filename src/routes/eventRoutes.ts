import { Router } from "express";
import { verifyToken, verifyEmailMatch } from "../middlewares/verifyToken";
import {
  getUpcomingLimited,
  getAllUpcomingEvents,
  getEventById,
  getMyEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  getJoinedEvents,
} from "../controllers/eventController";

const router = Router();

// Public routes
router.get("/events/upcoming", getUpcomingLimited);
router.get("/events", getAllUpcomingEvents);

// Protected routes (must come before "/events/:id" so they aren't swallowed by it)
router.get("/events/manage", verifyToken, verifyEmailMatch("query", "email"), getMyEvents);
router.post("/events", verifyToken, createEvent);

// Public: single event details
router.get("/events/:id", getEventById);

// Protected: update/delete/join
router.patch("/events/:id", verifyToken, updateEvent);
router.delete("/events/:id", verifyToken, deleteEvent);
router.post("/events/:id/join", verifyToken, joinEvent);

// Protected: joined events list
router.get("/joined-events", verifyToken, verifyEmailMatch("query", "email"), getJoinedEvents);

export default router;
