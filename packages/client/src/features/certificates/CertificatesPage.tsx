import { downloadAuthedFile } from "../../lib/download";
import { useCertificates } from "./api";

const ICONS: Record<string, string> = {
  completion: "🎓",
  excellence: "🌟",
  honor: "🏅",
  perfect_attendance: "🗓️",
};

export function CertificatesPage() {
  const { data, isLoading } = useCertificates();
  if (isLoading) return <p className="text-sm text-text-secondary">Loading certificates…</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {(data ?? []).map((c) => (
        <div key={c.type} className={`card flex flex-col items-center text-center gap-2 py-6 ${c.earned ? "" : "opacity-40"}`}>
          <span className="text-4xl">{ICONS[c.type] ?? "🎓"}</span>
          <h3 className="font-heading font-semibold">{c.label}</h3>
          {c.earned ? (
            <>
              <span className="text-xs text-text-secondary">Earned {c.earnedAt ? new Date(c.earnedAt).toLocaleDateString() : ""}</span>
              <button
                onClick={() => c.certificateId && downloadAuthedFile(`/api/certificates/${c.certificateId}/download`, `certificate-${c.type}.pdf`)}
                className="btn-primary text-xs mt-2"
              >
                View / Download PDF
              </button>
            </>
          ) : (
            <span className="text-xs text-text-secondary">Not yet earned</span>
          )}
        </div>
      ))}
    </div>
  );
}
