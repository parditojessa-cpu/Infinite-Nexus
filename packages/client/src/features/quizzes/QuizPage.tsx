import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProgressBar } from "../../components/ProgressBar";
import { useUiStore } from "../../lib/uiStore";
import { useQuiz, useSaveResponse, useStartAttempt, useSubmitAttempt } from "./api";
import { QuestionRenderer } from "./QuestionRenderer";

function formatTime(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function QuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const pushToast = useUiStore((s) => s.pushToast);
  const { data: quiz, isLoading } = useQuiz(quizId);
  const startAttempt = useStartAttempt(quizId);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const saveResponse = useSaveResponse(attemptId ?? undefined);
  const submitAttempt = useSubmitAttempt(attemptId ?? undefined);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const submittingRef = useRef(false);

  async function doSubmit(auto: boolean) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    const result = await submitAttempt.mutateAsync();
    pushToast(auto ? "Time's up — quiz submitted automatically." : "Quiz submitted", auto ? "danger" : "success");
    navigate(`/student/quizzes/attempts/${result.id}/review`);
  }

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      doSubmit(true);
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => (s !== null ? s - 1 : s)), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  if (isLoading) return <p className="text-sm text-text-secondary">Loading quiz…</p>;
  if (!quiz) return <p className="text-sm text-danger">Couldn't load this quiz.</p>;

  if (!attemptId) {
    return (
      <div className="card max-w-lg mx-auto flex flex-col gap-4">
        <h2 className="font-heading font-bold text-lg">{quiz.title}</h2>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-pill bg-bg px-3 py-1">⏱ {quiz.timerMinutes} min time limit</span>
          <span className="rounded-pill bg-bg px-3 py-1">✅ Passing score {quiz.passingScore}%</span>
          <span className="rounded-pill bg-bg px-3 py-1">
            🔁 Attempts {quiz.attemptsUsed}/{quiz.maxAttempts}
          </span>
          <span className="rounded-pill bg-bg px-3 py-1">{quiz.questions.length} questions</span>
        </div>
        <p className="text-xs text-warning">
          This is a timed, written activity. Once started, the quiz will auto-submit when the {quiz.timerMinutes}-minute
          limit runs out.
        </p>
        {!quiz.canAttempt ? (
          <p className="text-sm text-danger">You've used all your attempts for this quiz.</p>
        ) : (
          <button
            onClick={async () => {
              const attempt = await startAttempt.mutateAsync();
              setAttemptId(attempt.id);
              setSecondsLeft(quiz.timerMinutes * 60);
            }}
            className="btn-primary self-start"
          >
            Start Quiz
          </button>
        )}
      </div>
    );
  }

  const question = quiz.questions[index];
  const progress = ((index + 1) / quiz.questions.length) * 100;
  const timeLow = secondsLeft !== null && secondsLeft <= 60;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <ProgressBar value={progress} />
        <span
          className={`ml-3 shrink-0 text-sm font-semibold rounded-pill px-3 py-1 ${
            timeLow ? "bg-danger text-white" : "bg-bg text-text-primary"
          }`}
        >
          ⏱ {secondsLeft !== null ? formatTime(secondsLeft) : "—"}
        </span>
      </div>
      <span className="text-xs text-text-secondary">
        Question {index + 1} of {quiz.questions.length}
      </span>

      <div className="card">
        <p className="font-medium mb-4">{question.prompt}</p>
        <QuestionRenderer
          question={question}
          value={answers[question.id]}
          onChange={(value) => {
            setAnswers((a) => ({ ...a, [question.id]: value }));
            saveResponse.mutate({ questionId: question.id, response: value });
          }}
        />
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="text-sm px-4 py-2 rounded-control border border-border disabled:opacity-40"
        >
          Previous
        </button>
        {index < quiz.questions.length - 1 ? (
          <button onClick={() => setIndex((i) => i + 1)} className="btn-primary text-sm">
            Next
          </button>
        ) : (
          <button onClick={() => doSubmit(false)} className="btn-primary text-sm">
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
