import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { eventsCollection, joinedEventsCollection } from "../collections";
import { EventDocument } from "../types";

// GET /events/upcoming?limit=6  -> Home page "Recent Upcoming Events" (sorted by date, limited)
export const getUpcomingLimited = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 6;
    const todayISO = new Date().toISOString().slice(0, 10);

    const result = await eventsCollection()
      .find({ eventDate: { $gte: todayISO } })
      .sort({ eventDate: 1 })
      .limit(limit)
      .toArray();

    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to load upcoming events", error });
  }
};

// GET /events  -> Upcoming Events page (all future events, optional search/filter)
export const getAllUpcomingEvents = async (req: Request, res: Response) => {
  try {
    const { search, eventType } = req.query;
    const todayISO = new Date().toISOString().slice(0, 10);

    const query: Record<string, unknown> = { eventDate: { $gte: todayISO } };

    if (search) {
      query.$or = [
        { title: { $regex: search as string, $options: "i" } },
        { location: { $regex: search as string, $options: "i" } },
      ];
    }

    if (eventType && eventType !== "all") {
      query.eventType = eventType;
    }

    const result = await eventsCollection().find(query).sort({ eventDate: 1 }).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to load events", error });
  }
};

// GET /events/:id -> Event details page (public)
export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid event id" });
    }
    const result = await eventsCollection().findOne({ _id: new ObjectId(id) });
    if (!result) {
      return res.status(404).send({ message: "Event not found" });
    }
    // Real count of how many people have joined this event, not a placeholder.
    const joinedCount = await joinedEventsCollection().countDocuments({ eventId: id });
    res.send({ ...result, joinedCount });
  } catch (error) {
    res.status(500).send({ message: "Failed to load event", error });
  }
};

// GET /events/manage?email=... -> Manage Events page (protected, only own events)
export const getMyEvents = async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    const result = await eventsCollection()
      .find({ creatorEmail: email })
      .sort({ eventDate: 1 })
      .toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to load your events", error });
  }
};

// POST /events -> Create Event (protected)
export const createEvent = async (req: Request, res: Response) => {
  try {
    const event = req.body as EventDocument;

    if (!event.title || !event.description || !event.eventType || !event.eventDate) {
      return res.status(400).send({ message: "Missing required event fields" });
    }

    const todayISO = new Date().toISOString().slice(0, 10);
    if (event.eventDate < todayISO) {
      return res.status(400).send({ message: "Event date must be in the future" });
    }

    if (event.creatorEmail !== req.decoded?.email) {
      return res.status(403).send({ message: "Forbidden access" });
    }

    event.createdAt = new Date().toISOString();

    const result = await eventsCollection().insertOne(event);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to create event", error });
  }
};

// PATCH /events/:id -> Update Event (protected, only creator)
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid event id" });
    }

    const existing = await eventsCollection().findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).send({ message: "Event not found" });
    }
    if (existing.creatorEmail !== req.decoded?.email) {
      return res.status(403).send({ message: "Forbidden: not your event" });
    }

    const { _id, creatorEmail, createdAt, ...safeUpdates } = req.body;
    const updatedDoc = { $set: safeUpdates as Partial<EventDocument> };
    const result = await eventsCollection().updateOne({ _id: new ObjectId(id) }, updatedDoc);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to update event", error });
  }
};

// DELETE /events/:id -> Delete Event (protected, only creator)
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid event id" });
    }

    const existing = await eventsCollection().findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).send({ message: "Event not found" });
    }
    if (existing.creatorEmail !== req.decoded?.email) {
      return res.status(403).send({ message: "Forbidden: not your event" });
    }

    const result = await eventsCollection().deleteOne({ _id: new ObjectId(id) });
    // Also clean up any joined-event records tied to this event.
    await joinedEventsCollection().deleteMany({ eventId: id });
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to delete event", error });
  }
};

// POST /events/:id/join -> Join Event (protected)
export const joinEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid event id" });
    }

    const event = await eventsCollection().findOne({ _id: new ObjectId(id) });
    if (!event) {
      return res.status(404).send({ message: "Event not found" });
    }

    const userEmail = req.decoded?.email as string;

    const alreadyJoined = await joinedEventsCollection().findOne({
      eventId: id,
      userEmail,
    });
    if (alreadyJoined) {
      return res.status(409).send({ message: "You already joined this event" });
    }

    const joinedDoc = {
      eventId: id,
      userEmail,
      userName: req.body?.userName || req.decoded?.name,
      eventTitle: event.title,
      eventDate: event.eventDate,
      eventType: event.eventType,
      location: event.location,
      thumbnail: event.thumbnail,
      joinedAt: new Date().toISOString(),
    };

    const result = await joinedEventsCollection().insertOne(joinedDoc);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to join event", error });
  }
};

// GET /joined-events?email=... -> Joined Events page (protected, sorted by event date)
export const getJoinedEvents = async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    const result = await joinedEventsCollection()
      .find({ userEmail: email })
      .sort({ eventDate: 1 })
      .toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to load joined events", error });
  }
};