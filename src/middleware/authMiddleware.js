
import jwt from "jsonwebtoken";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return res
        .status(500)
        .json({ message: "JWT secret missing. Check .env setup" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    console.error("JWT verify error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
