import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { DecodedUser } from "../types";

// Augment Express's Request type so `req.decoded` is typed everywhere.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      decoded?: DecodedUser;
    }
  }
}

/**
 * Verifies the Bearer JWT sent in the Authorization header.
 * Protects any route it is attached to — used for create/update/delete event,
 * join event, and "my events" style endpoints.
 */
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.decoded = decoded as DecodedUser;
    next();
  });
};

/**
 * Use AFTER verifyToken on routes where the email in the request
 * (query param, body, or route param) must match the token's email.
 * Prevents a logged-in user from reading/modifying another user's data.
 */
export const verifyEmailMatch = (paramSource: "query" | "body" = "query", key = "email") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestEmail =
      paramSource === "query" ? (req.query[key] as string) : (req.body?.[key] as string);

    if (requestEmail && requestEmail !== req.decoded?.email) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    next();
  };
};
