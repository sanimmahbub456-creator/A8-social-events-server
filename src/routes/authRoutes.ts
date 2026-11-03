import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

/**
 * POST /jwt
 * Body: { email, name }
 * Called by the client right after a successful BetterAuth login/registration
 * (email/password or Google) to mint an API token for this Express server.
 * The client stores the returned token and sends it as "Authorization: Bearer <token>"
 * on every protected request (create/update/delete event, join event, etc).
 */
router.post("/jwt", (req, res) => {
  const { email, name } = req.body;

  if (!email) {
    return res.status(400).send({ message: "Email is required" });
  }

  const token = jwt.sign({ email, name }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });

  res.send({ token });
});

export default router;
