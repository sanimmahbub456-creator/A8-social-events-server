# Social Development Events Platform — Server

Express + TypeScript + MongoDB REST API powering the Social Development Events Platform, a community-driven event management app for local social-service events (clothes distribution, blanket drives, plantation days, cleanups, and similar).

- **Live API URL:** https://a8-social-events-server.onrender.com
- **Client repo:** https://github.com/sanimmahbub456-creator/A8-social-events-client

## Features

- JWT-protected API: create, update, delete, join, and list events are all guarded by `verifyToken`, and a user can only manage data tied to their own email.
- Upcoming-events endpoints filter out events whose date has already passed and support a `.limit()`-based "recent 6" query for the home page.
- Join-event flow stores a join record linked to both the event and the joining user, with duplicate-join protection.
- Clean separation of routes, controllers, middleware, and DB config for easy extension.
- CORS locked to the configured client origin(s) only.
- Centralized error handling with meaningful HTTP status codes (400/401/403/404/409/500).

## Tech Stack

Express 4, TypeScript, MongoDB (native driver), jsonwebtoken, cors, dotenv.

## Getting Started

```bash
npm install
cp .env.example .env   # then fill in your own values
npm run dev             # starts on http://localhost:5000
```

## Environment Variables

See `.env.example`. You need a MongoDB connection string, a JWT secret (shared with the client's token-signing config), and your client's URL for CORS.

## API Overview

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/jwt` | public | Issue a JWT for a logged-in user |
| GET | `/events/upcoming?limit=6` | public | Recent upcoming events for the home page |
| GET | `/events?search=&eventType=` | public | All upcoming events (search/filter) |
| GET | `/events/:id` | public | Single event details |
| POST | `/events` | protected | Create an event |
| GET | `/events/manage?email=` | protected | Events created by the logged-in user |
| PATCH | `/events/:id` | protected | Update an event (creator only) |
| DELETE | `/events/:id` | protected | Delete an event (creator only) |
| POST | `/events/:id/join` | protected | Join an event |
| GET | `/joined-events?email=` | protected | Events joined by the logged-in user |

## Deployment

Build with `npm run build`, start with `npm start`. Set the same environment variables on your host (Render) as in `.env.example`, and point `CLIENT_URL` at your deployed client domain.
