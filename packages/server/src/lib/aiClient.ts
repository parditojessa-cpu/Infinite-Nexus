import Anthropic from "@anthropic-ai/sdk";
import { HttpError } from "../middleware/errorHandler.js";

const MODEL = "claude-sonnet-5";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new HttpError(503, "AI service not configured — ANTHROPIC_API_KEY is missing");
  }
  return new Anthropic({ apiKey });
}

const TUTOR_SYSTEM_PROMPT = `You are a patient, encouraging AI tutor for Philippine Senior High School students using the Finite Nexus learning platform. A student will give you a problem (math, science, or general academic). Always respond in this exact format:

Step 1: <first step, explained clearly>
Step 2: <next step>
... (as many steps as needed)
Answer: <the final answer, clearly labeled>

Keep each step concise and easy to follow. If the student asks a follow-up question, use the prior conversation for context and respond in the same step-by-step format where applicable.`;

export interface WhiteboardTurn {
  role: "student" | "ai";
  content: string;
}

export async function solveProblem(history: WhiteboardTurn[]): Promise<string> {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: TUTOR_SYSTEM_PROMPT,
    messages: history.map((turn) => ({
      role: turn.role === "student" ? "user" : "assistant",
      content: turn.content,
    })),
  });
  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new HttpError(502, "AI response did not contain any text");
  }
  return block.text;
}

export interface ActivitySheetParams {
  topic: string;
  gradeLevel?: string;
  learningArea?: string;
  competency?: string;
  numItems: number;
  difficulty: string;
}

export interface GeneratedActivitySheet {
  title: string;
  instructions: string;
  questions: { prompt: string; answer: string }[];
}

const ACTIVITY_SYSTEM_PROMPT = `You are an assistant that writes practice activity sheets for Philippine Senior High School teachers. Given a topic and parameters, respond with ONLY valid JSON (no markdown fences, no commentary) matching exactly this shape:
{"title": string, "instructions": string, "questions": [{"prompt": string, "answer": string}, ...]}
Generate exactly the requested number of questions, appropriate for the given grade level and difficulty.`;

export async function generateActivityQuestions(params: ActivitySheetParams): Promise<GeneratedActivitySheet> {
  const client = getClient();
  const userPrompt = `Topic: ${params.topic}
Grade level: ${params.gradeLevel ?? "Senior High School"}
Learning area: ${params.learningArea ?? "General"}
Competency: ${params.competency ?? "N/A"}
Difficulty: ${params.difficulty}
Number of questions: ${params.numItems}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: ACTIVITY_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });
  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new HttpError(502, "AI response did not contain any text");
  }
  try {
    return JSON.parse(block.text) as GeneratedActivitySheet;
  } catch {
    throw new HttpError(502, "AI returned malformed activity sheet data — please try again");
  }
}
