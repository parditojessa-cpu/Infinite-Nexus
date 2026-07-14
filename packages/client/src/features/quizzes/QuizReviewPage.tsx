import { useParams } from "react-router-dom";
import { Badge } from "../../components/Badge";
import { useAttemptReview } from "./api";

function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "(no answer)";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return Object.entries(v as Record<string, string>).map(([k, val]) => `${k} → ${val}`).join("; ");
  return String(v);
}

export function QuizReviewPage() {
  const { attemptId } = useParams();
  const { data, isLoading } = useAttemptReview(attemptId);

  if (isLoading) return <p className="text-sm text-text-secondary">Loading results…</p>;
  if (!data) return <p className="text-sm text-danger">Couldn't load results.</p>;

  const hasEssay = data.questions.some((q) => q.needsManualReview);

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      <div className="card flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-xl">
            {data.score}/{data.maxScore}
          </h2>
          {hasEssay && <p className="text-xs text-warning">Some items are pending manual review.</p>}
        </div>
        {data.passed !== null && (
          <Badge label={data.passed ? "Passed" : "Failed"} color={data.passed ? "var(--color-success)" : "var(--color-danger)"} />
        )}
      </div>

      {data.questions.map((q, i) => (
        <div
          key={q.id}
          className="card border-l-4"
          style={{
            borderLeftColor: q.needsManualReview ? "var(--color-warning)" : q.isCorrect ? "var(--color-success)" : "var(--color-danger)",
          }}
        >
          <p className="font-medium text-sm mb-2">
            {i + 1}. {q.prompt}
          </p>
          <p className="text-sm text-text-secondary">Your answer: {formatValue(q.response)}</p>
          {!q.needsManualReview && !q.isCorrect && (
            <p className="text-sm text-success">Correct answer: {formatValue(q.correctAnswer)}</p>
          )}
          <p className="text-xs text-text-secondary mt-1">
            {q.needsManualReview ? "Pending review" : `${q.pointsAwarded}/${q.points} points`}
          </p>
        </div>
      ))}
    </div>
  );
}
