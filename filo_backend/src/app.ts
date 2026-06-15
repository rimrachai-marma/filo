import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import routes from "./routes";
import { errorHandler, routeNotFound } from "./middleware/errorHandler";

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(",").map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// ─── JSON BigInt Support ─────────────────────────────────────────────────────
declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};

// ─── Body Parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Logging & Dev Middleware ────────────────────────────────────────────────
app.use(morgan("dev"));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use(routes);

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(routeNotFound);
app.use(errorHandler);

export default app;
