import { useState } from "react";
import { ROOT_CAUSES, INTERVENTION_STRATEGIES } from "@finite-nexus/shared";
import { ROOT_CAUSE_LABELS, INTERVENTION_STRATEGY_LABELS } from "@finite-nexus/shared";
import { useUiStore } from "../../lib/uiStore";
import { useCreatePlan } from "./api";

function CheckGroup({
  options,
  labels,
  selected,
  onToggle,
}: {
  options: readonly string[];
  labels: Record<string, string>;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
      {options.map((o) => (
        <label key={o} className="flex items-center gap-1.5 text-xs">
          <input type="checkbox" checked={selected.includes(o)} onChange={() => onToggle(o)} />
          {labels[o] ?? o}
        </label>
      ))}
    </div>
  );
}

export function IIPForm({ studentId, onCreated }: { studentId: string; onCreated?: () => void }) {
  const [subject, setSubject] = useState("");
  const [competency, setCompetency] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [rootCauses, setRootCauses] = useState<string[]>([]);
  const [strategies, setStrategies] = useState<string[]>([]);
  const [schedule, setSchedule] = useState("");
  const [targetScore, setTargetScore] = useState(75);
  const [expectedCompletion, setExpectedCompletion] = useState("");
  const create = useCreatePlan();
  const pushToast = useUiStore((s) => s.pushToast);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="rounded-control border px-3 py-2 text-sm" />
        <input
          value={competency}
          onChange={(e) => setCompetency(e.target.value)}
          placeholder="Competency"
          className="rounded-control border px-3 py-2 text-sm"
        />
      </div>
      <input
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
        placeholder="Difficulty identified"
        className="rounded-control border px-3 py-2 text-sm"
      />

      <div>
        <p className="text-xs font-semibold text-text-secondary mb-1">Root Cause(s)</p>
        <CheckGroup options={ROOT_CAUSES} labels={ROOT_CAUSE_LABELS} selected={rootCauses} onToggle={(v) => toggle(rootCauses, setRootCauses, v)} />
      </div>

      <div>
        <p className="text-xs font-semibold text-text-secondary mb-1">Intervention Strategies</p>
        <CheckGroup
          options={INTERVENTION_STRATEGIES}
          labels={INTERVENTION_STRATEGY_LABELS}
          selected={strategies}
          onToggle={(v) => toggle(strategies, setStrategies, v)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="Schedule" className="rounded-control border px-3 py-2 text-sm" />
        <input
          type="number"
          value={targetScore}
          onChange={(e) => setTargetScore(Number(e.target.value))}
          placeholder="Target score"
          className="rounded-control border px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={expectedCompletion}
          onChange={(e) => setExpectedCompletion(e.target.value)}
          className="rounded-control border px-3 py-2 text-sm"
        />
      </div>

      <button
        onClick={async () => {
          await create.mutateAsync({
            studentId,
            subject,
            competency,
            difficulty,
            rootCauses,
            strategies,
            schedule,
            targetScore,
            expectedCompletion,
          });
          pushToast("Intervention plan created", "success");
          setSubject("");
          setCompetency("");
          setDifficulty("");
          setRootCauses([]);
          setStrategies([]);
          onCreated?.();
        }}
        disabled={!subject}
        className="btn-primary text-sm self-start"
      >
        Create Intervention Plan
      </button>
    </div>
  );
}
