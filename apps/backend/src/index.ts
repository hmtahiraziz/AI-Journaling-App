import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error";
import authRoutes from "./routes/auth";
import promptsRoutes from "./routes/prompts";
import journalsRoutes from "./routes/journals";
import moodsRoutes from "./routes/moods";
import insightsRoutes from "./routes/insights";
import meRoutes from "./routes/me";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN === "*" ? true : env.CLIENT_ORIGIN.split(","),
  })
);
app.use(express.json({ limit: "1mb" }));

/** Liveness probe — registered before auth / rate-limited routes. */
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "journal-iq-api" });
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Stricter limit for password-reset requests (abuse / inbox flooding). */
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many reset requests. Please wait a few minutes and try again." },
});

app.use("/auth/forgot-password", forgotPasswordLimiter);
app.use("/auth", authLimiter, authRoutes);
app.use("/prompts", promptsRoutes);
app.use("/journals", journalsRoutes);
app.use("/moods", moodsRoutes);
app.use("/insights", insightsRoutes);
app.use("/me", meRoutes);

app.use(errorHandler);

const port = Number(process.env.PORT || 5000);
const host = "0.0.0.0";

const server = app.listen(port, host, () => {
  console.log(`Journal IQ API listening on http://${host}:${port}`);
});

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down gracefully`);
  server.close((err) => {
    if (err) {
      console.error("Error during shutdown", err);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
