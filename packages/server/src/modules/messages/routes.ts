import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";

export const messagesRouter = Router();

messagesRouter.get(
  "/conversations",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId: req.user!.userId },
      include: {
        conversation: {
          include: {
            participants: { include: { user: true } },
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
    });

    return res.json(
      participations.map((p) => {
        const others = p.conversation.participants.filter((pp) => pp.userId !== req.user!.userId);
        const lastMessage = p.conversation.messages[0];
        return {
          id: p.conversation.id,
          participantNames: others.map((o) => `${o.user.firstName} ${o.user.lastName}`).join(", "),
          lastMessage: lastMessage?.body ?? null,
          lastMessageAt: lastMessage?.createdAt ?? null,
        };
      })
    );
  })
);

messagesRouter.post(
  "/conversations",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { recipientId } = req.body;
    const existing = await prisma.conversationParticipant.findFirst({
      where: { userId: req.user!.userId, conversation: { participants: { some: { userId: recipientId } } } },
    });
    if (existing) return res.json({ id: existing.conversationId });

    const conversation = await prisma.conversation.create({
      data: {
        participants: { create: [{ userId: req.user!.userId }, { userId: recipientId }] },
      },
    });
    return res.status(201).json({ id: conversation.id });
  })
);

messagesRouter.get(
  "/conversations/:id/messages",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.id },
      include: { sender: true },
      orderBy: { createdAt: "asc" },
    });
    return res.json(
      messages.map((m) => ({
        id: m.id,
        body: m.body,
        senderId: m.senderId,
        senderName: `${m.sender.firstName} ${m.sender.lastName}`,
        isMe: m.senderId === req.user!.userId,
        createdAt: m.createdAt,
      }))
    );
  })
);

messagesRouter.post(
  "/conversations/:id/messages",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const message = await prisma.message.create({
      data: {
        conversationId: req.params.id,
        senderId: req.user!.userId,
        body: req.body.body,
      },
    });
    return res.status(201).json(message);
  })
);

messagesRouter.get(
  "/contacts",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { userId, role } = req.user!;
    if (role === "student") {
      const enrollments = await prisma.enrollment.findMany({ where: { studentId: userId }, include: { course: { include: { teacher: true } } } });
      const teachers = new Map(enrollments.map((e) => [e.course.teacher.id, e.course.teacher]));
      return res.json(Array.from(teachers.values()).map((t) => ({ id: t.id, name: `${t.firstName} ${t.lastName}` })));
    }
    const courses = await prisma.course.findMany({ where: { teacherId: userId }, include: { enrollments: { include: { student: true } } } });
    const students = new Map(courses.flatMap((c) => c.enrollments.map((e) => [e.student.id, e.student])));
    return res.json(Array.from(students.values()).map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}` })));
  })
);
