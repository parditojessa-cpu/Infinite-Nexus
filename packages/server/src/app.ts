import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { authRouter } from "./modules/auth/routes.js";
import { dashboardRouter } from "./modules/dashboard/routes.js";
import { usersRouter } from "./modules/users/routes.js";
import { coursesRouter } from "./modules/courses/routes.js";
import { modulesRouter, lessonsRouter } from "./modules/content/routes.js";
import { discussionsRouter } from "./modules/discussions/routes.js";
import { filesRouter } from "./modules/files/routes.js";
import { assignmentsRouter } from "./modules/assignments/routes.js";
import { quizzesRouter, attemptsRouter } from "./modules/quizzes/routes.js";
import { gradebookRouter } from "./modules/gradebook/routes.js";
import { gamificationRouter } from "./modules/gamification/routes.js";
import { progressRouter } from "./modules/progress/routes.js";
import { attendanceRouter } from "./modules/attendance/routes.js";
import { interventionsRouter } from "./modules/interventions/routes.js";
import { certificatesRouter } from "./modules/certificates/routes.js";
import { announcementsRouter } from "./modules/announcements/routes.js";
import { messagesRouter } from "./modules/messages/routes.js";
import { dllLibraryRouter } from "./modules/dllLibrary/routes.js";
import { studentsRouter } from "./modules/students/routes.js";
import { whiteboardRouter } from "./modules/whiteboard/routes.js";
import { activitySheetsRouter } from "./modules/activitySheets/routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Populated by the client's `vite build`. Present in production (single
// Render service serving both API and static client); absent in local dev,
// where Vite's own dev server serves the client instead.
const clientDist = path.resolve(__dirname, "../../client/dist");

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/courses", coursesRouter);
  app.use("/api/modules", modulesRouter);
  app.use("/api/lessons", lessonsRouter);
  app.use("/api/discussions", discussionsRouter);
  app.use("/api/files", filesRouter);
  app.use("/api/assignments", assignmentsRouter);
  app.use("/api/quizzes", quizzesRouter);
  app.use("/api/attempts", attemptsRouter);
  app.use("/api/gradebook", gradebookRouter);
  app.use("/api/gamification", gamificationRouter);
  app.use("/api/progress", progressRouter);
  app.use("/api/attendance", attendanceRouter);
  app.use("/api/interventions", interventionsRouter);
  app.use("/api/certificates", certificatesRouter);
  app.use("/api/announcements", announcementsRouter);
  app.use("/api/messages", messagesRouter);
  app.use("/api/dll-documents", dllLibraryRouter);
  app.use("/api/students", studentsRouter);
  app.use("/api/whiteboard", whiteboardRouter);
  app.use("/api/activity-sheets", activitySheetsRouter);

  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    // SPA fallback for client-side routes (e.g. /student/dashboard on a
    // hard reload) — anything that isn't an API call resolves to index.html.
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  app.use(errorHandler);

  return app;
}
