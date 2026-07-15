import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { solveProblem } from "../../lib/aiClient.js";

export const whiteboardRouter = Router();

const createSessionSchema = z.object({
  title: z.string().min(1).optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1, "Message can't be empty"),
});

whiteboardRouter.get(
  "/sessions",
  requireAuth,
  requireRole("student"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const sessions = await prisma.whiteboardSession.findMany({
      where: { studentId: req.user!.userId },
      orderBy: { updatedAt: "desc" },
    });
    return res.json(sessions);
  })
);

whiteboardRouter.post(
  "/sessions",
  requireAuth,
  requireRole("student"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = createSessionSchema.parse(req.body ?? {});
    const session = await prisma.whiteboardSession.create({
      data: { studentId: req.user!.userId, title: input.title ?? "Untitled problem" },
    });
    return res.status(201).json(session);
  })
);

whiteboardRouter.get(
  "/sessions/:id",
  requireAuth,
  requireRole("student"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const session = await prisma.whiteboardSession.findFirst({
      where: { id: req.params.id, studentId: req.user!.userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    return res.json(session);
  })
);

whiteboardRouter.post(
  "/sessions/:id/messages",
  requireAuth,
  requireRole("student"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = sendMessageSchema.parse(req.body);
    const session = await prisma.whiteboardSession.findFirst({
      where: { id: req.params.id, studentId: req.user!.userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const studentMessage = await prisma.whiteboardMessage.create({
      data: { sessionId: session.id, role: "student", content: input.content },
    });

    const history = [...session.messages, studentMessage].map((m) => ({
      role: m.role as "student" | "ai",
      content: m.content,
    }));
    const aiText = await solveProblem(history);

    const aiMessage = await prisma.whiteboardMessage.create({
      data: { sessionId: session.id, role: "ai", content: aiText },
    });

    if (session.title === "Untitled problem") {
      await prisma.whiteboardSession.update({
        where: { id: session.id },
        data: { title: input.content.slice(0, 60) },
      });
    } else {
      await prisma.whiteboardSession.update({ where: { id: session.id }, data: {} });
    }

    return res.status(201).json({ studentMessage, aiMessage });
  })
);

whiteboardRouter.delete(
  "/sessions/:id",
  requireAuth,
  requireRole("student"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const session = await prisma.whiteboardSession.findFirst({
      where: { id: req.params.id, studentId: req.user!.userId },
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    await prisma.whiteboardMessage.deleteMany({ where: { sessionId: session.id } });
    await prisma.whiteboardSession.delete({ where: { id: session.id } });
    return res.status(204).send();
  })
);
