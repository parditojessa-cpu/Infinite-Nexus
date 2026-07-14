import { XP_RULES } from "@finite-nexus/shared";
import { ProgressBar } from "../../components/ProgressBar";
import { useGamification, useLeaderboard } from "./api";

const XP_LABELS: Record<string, string> = {
  complete_lesson: "Complete Lesson",
  complete_quiz: "Complete Quiz",
  perfect_quiz: "Perfect Quiz",
  complete_assignment: "Complete Assignment",
  daily_login: "Daily Login",
};

export function GamificationPage() {
  const { data, isLoading } = useGamification();
  const { data: leaderboard } = useLeaderboard(data?.sectionId ?? undefined);

  if (isLoading) return <p className="text-sm text-text-secondary">Loading…</p>;
  if (!data) return <p className="text-sm text-danger">Couldn't load your progress.</p>;

  return (
    <div className="flex flex-col gap-5">
      <div
        className="rounded-card p-6 text-white flex flex-col gap-3"
        style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}
      >
        <span className="text-xs uppercase tracking-wide text-white/80">Level {data.level}</span>
        <h2 className="font-heading font-bold text-2xl">{data.levelName}</h2>
        <div>
          <div className="flex justify-between text-xs mb-1 text-white/90">
            <span>{data.xp} XP</span>
            {data.nextLevelXp && <span>{data.xpToNext} XP to next level</span>}
          </div>
          <ProgressBar
            value={data.nextLevelXp ? (100 * data.xp) / data.nextLevelXp : 100}
            color="white"
          />
        </div>
      </div>

      <div className="card">
        <h3 className="font-heading font-semibold mb-3">Badges</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {data.badges.map((b) => (
            <div
              key={b.id}
              className={`border border-border rounded-control p-3 text-center flex flex-col items-center gap-1 ${
                b.earned ? "" : "opacity-40"
              }`}
            >
              <span className="text-2xl">{b.icon}</span>
              <span className="text-xs font-semibold">{b.name}</span>
              <span className="text-[10px] text-text-secondary">{b.description}</span>
            </div>
          ))}
        </div>
      </div>

      {leaderboard && (
        <div className="card">
          <h3 className="font-heading font-semibold mb-3">Section Leaderboard</h3>
          <div className="flex flex-col gap-1">
            {leaderboard.map((entry) => (
              <div
                key={entry.studentId}
                className={`flex items-center justify-between px-3 py-2 rounded-control text-sm ${
                  entry.isMe ? "bg-primary/10 font-semibold" : entry.rank <= 3 ? "bg-bg" : ""
                }`}
              >
                <span>
                  #{entry.rank} {entry.isMe ? "You" : entry.name}
                </span>
                <span className="text-text-secondary">{entry.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="font-heading font-semibold mb-3">How to Earn XP</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
          {Object.entries(XP_RULES).map(([key, amount]) => (
            <div key={key} className="flex justify-between border border-border rounded-control px-3 py-2">
              <span>{XP_LABELS[key] ?? key}</span>
              <span className="font-semibold text-primary">+{amount}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="font-heading font-semibold mb-3">Level Ladder</h3>
        <div className="flex flex-col gap-1">
          {data.ladder.map((l) => (
            <div
              key={l.level}
              className={`flex justify-between px-3 py-2 rounded-control text-sm ${
                l.level === data.level ? "bg-primary/10 font-semibold" : ""
              }`}
            >
              <span>
                Level {l.level} — {l.name}
              </span>
              <span className="text-text-secondary">{l.xpRequired} XP</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
