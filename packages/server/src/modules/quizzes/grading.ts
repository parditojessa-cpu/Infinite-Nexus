export interface GradeResult {
  isCorrect: boolean | null;
  pointsAwarded: number | null;
  needsManualReview: boolean;
}

function normalize(s: unknown): string {
  return String(s ?? "").trim().toLowerCase();
}

export function gradeResponse(type: string, response: unknown, correctAnswer: unknown, points: number): GradeResult {
  switch (type) {
    case "multiple_choice":
    case "true_false":
    case "image_question": {
      const correct = normalize(response) === normalize(correctAnswer);
      return { isCorrect: correct, pointsAwarded: correct ? points : 0, needsManualReview: false };
    }
    case "identification":
    case "short_answer": {
      const correct = normalize(response) === normalize(correctAnswer);
      return { isCorrect: correct, pointsAwarded: correct ? points : 0, needsManualReview: false };
    }
    case "checkbox": {
      const chosen = Array.isArray(response) ? response.map(normalize).sort() : [];
      const expected = Array.isArray(correctAnswer) ? correctAnswer.map(normalize).sort() : [];
      const correct = chosen.length === expected.length && chosen.every((v, i) => v === expected[i]);
      return { isCorrect: correct, pointsAwarded: correct ? points : 0, needsManualReview: false };
    }
    case "matching": {
      const chosen = response && typeof response === "object" ? (response as Record<string, string>) : {};
      const expected = correctAnswer && typeof correctAnswer === "object" ? (correctAnswer as Record<string, string>) : {};
      const keys = Object.keys(expected);
      const correct = keys.length > 0 && keys.every((k) => normalize(chosen[k]) === normalize(expected[k]));
      return { isCorrect: correct, pointsAwarded: correct ? points : 0, needsManualReview: false };
    }
    case "essay":
      return { isCorrect: null, pointsAwarded: null, needsManualReview: true };
    default:
      return { isCorrect: null, pointsAwarded: null, needsManualReview: true };
  }
}
