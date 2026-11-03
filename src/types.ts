export type EventType =
  | "Cleanup"
  | "Plantation"
  | "Donation"
  | "Blood Drive"
  | "Awareness Campaign"
  | "Other";

export interface EventDocument {
  title: string;
  description: string;
  eventType: EventType;
  thumbnail: string;
  location: string;
  eventDate: string; // ISO date string, always in the future at creation time
  creatorEmail: string;
  creatorName?: string;
  createdAt: string;
}

export interface JoinedEventDocument {
  eventId: string;
  userEmail: string;
  userName?: string;
  joinedAt: string;
}

// Shape of the decoded JWT payload issued by the client auth system.
export interface DecodedUser {
  email: string;
  name?: string;
  [key: string]: unknown;
}
