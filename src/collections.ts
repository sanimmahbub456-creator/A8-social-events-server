import { getDB } from "./config/db";

// Centralized collection accessors so routes/controllers never hard-code names.
export const eventsCollection = () => getDB().collection("events");
export const joinedEventsCollection = () => getDB().collection("joinedEvents");
