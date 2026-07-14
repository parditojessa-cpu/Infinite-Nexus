import { useState } from "react";
import { Badge } from "../../components/Badge";
import { useCreateProgram, useDeleteProgram, usePrograms, useUpdateProgramStatus } from "./api";

const STATUS_COLOR: Record<string, string> = {
  draft: "var(--color-text-secondary)",
  active: "var(--color-success)",
  completed: "var(--color-info)",
  archived: "var(--color-danger)",
};

export function ProgramsPanel() {
  const { data: programs } = usePrograms();
  const create = useCreateProgram();
  const updateStatus = useUpdateProgramStatus();
  const del = useDeleteProgram();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState("tier1");

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => setOpen((o) => !o)} className="btn-primary text-sm self-start">
        {open ? "Cancel" : "+ New Program"}
      </button>
      {open && (
        <div className="card flex flex-col gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Program name" className="rounded-control border px-3 py-2 text-sm" />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={2}
            className="rounded-control border px-3 py-2 text-sm"
          />
          <select value={tier} onChange={(e) => setTier(e.target.value)} className="rounded-control border px-3 py-2 text-sm">
            <option value="tier1">Tier 1</option>
            <option value="tier2">Tier 2</option>
            <option value="tier3">Tier 3</option>
          </select>
          <button
            onClick={async () => {
              await create.mutateAsync({ name, description, tier });
              setName("");
              setDescription("");
              setOpen(false);
            }}
            disabled={!name}
            className="btn-primary text-sm self-start"
          >
            Save Program
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {(programs ?? []).map((p) => (
          <div key={p.id} className="card flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{p.name}</p>
              <p className="text-xs text-text-secondary">{p.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge label={p.status} color={STATUS_COLOR[p.status] ?? "#888"} />
              <select
                value={p.status}
                onChange={(e) => updateStatus.mutate({ id: p.id, status: e.target.value })}
                className="text-xs rounded-control border px-2 py-1"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
              <button onClick={() => del.mutate(p.id)} className="text-xs text-danger">
                Delete
              </button>
            </div>
          </div>
        ))}
        {(programs ?? []).length === 0 && <p className="text-sm text-text-secondary">No programs yet.</p>}
      </div>
    </div>
  );
}
