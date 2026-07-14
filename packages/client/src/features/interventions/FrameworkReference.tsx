const TIERS = [
  {
    tier: "Tier 1 — Universal",
    audience: "All learners",
    frequency: "Weekly monitoring",
    strategies: ["Reinforcement Activities", "Gamified Learning", "Practice Worksheets"],
  },
  {
    tier: "Tier 2 — Targeted",
    audience: "Below 75%",
    frequency: "Twice-weekly monitoring",
    strategies: ["Peer Tutoring", "Small Group Discussion", "Remediation"],
  },
  {
    tier: "Tier 3 — Intensive",
    audience: "Consistently failing",
    frequency: "Daily monitoring",
    strategies: ["Individual Coaching", "Parent Conference", "Learning Contract"],
  },
];

export function FrameworkReference() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {TIERS.map((t) => (
        <div key={t.tier} className="card">
          <h3 className="font-heading font-semibold mb-1">{t.tier}</h3>
          <p className="text-xs text-text-secondary mb-1">{t.audience}</p>
          <p className="text-xs text-text-secondary mb-3">{t.frequency}</p>
          <ul className="text-sm list-disc pl-5">
            {t.strategies.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
