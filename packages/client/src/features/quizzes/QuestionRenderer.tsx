import type { QuizQuestion } from "./api";

export function QuestionRenderer({
  question,
  value,
  onChange,
}: {
  question: QuizQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (question.type) {
    case "multiple_choice":
    case "true_false":
    case "image_question":
      return (
        <div className="flex flex-col gap-2">
          {question.imageUrl && (
            <img src={question.imageUrl} alt="" className="max-w-[160px] rounded-control border border-border mb-2" />
          )}
          {(question.options ?? []).map((opt) => (
            <label
              key={opt}
              className={`flex items-center gap-2 border rounded-control px-3 py-2 text-sm cursor-pointer ${
                value === opt ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <input type="radio" checked={value === opt} onChange={() => onChange(opt)} />
              {opt}
            </label>
          ))}
        </div>
      );

    case "checkbox": {
      const selected: string[] = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-col gap-2">
          {(question.options ?? []).map((opt) => (
            <label
              key={opt}
              className={`flex items-center gap-2 border rounded-control px-3 py-2 text-sm cursor-pointer ${
                selected.includes(opt) ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={(e) =>
                  onChange(e.target.checked ? [...selected, opt] : selected.filter((o) => o !== opt))
                }
              />
              {opt}
            </label>
          ))}
        </div>
      );
    }

    case "identification":
    case "short_answer":
      return (
        <input
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer…"
          className="w-full rounded-control border px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--color-border-strong)" }}
        />
      );

    case "essay":
      return (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          placeholder="Write your response…"
          className="w-full rounded-control border p-3 text-sm"
          style={{ borderColor: "var(--color-border-strong)" }}
        />
      );

    case "matching": {
      const pairs = question.matchingPairs ?? {};
      const currentValue = (value as Record<string, string>) ?? {};
      const rightOptions = Object.values(pairs);
      return (
        <div className="flex flex-col gap-2">
          {Object.keys(pairs).map((term) => (
            <div key={term} className="flex items-center gap-2 text-sm">
              <span className="w-40 font-medium">{term}</span>
              <select
                value={currentValue[term] ?? ""}
                onChange={(e) => onChange({ ...currentValue, [term]: e.target.value })}
                className="flex-1 rounded-control border px-3 py-2 text-sm"
                style={{ borderColor: "var(--color-border-strong)" }}
              >
                <option value="">Select a match…</option>
                {rightOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      );
    }

    default:
      return <p className="text-sm text-danger">Unsupported question type: {question.type}</p>;
  }
}
