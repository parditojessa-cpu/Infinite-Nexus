export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 py-16 text-center">
      <span className="text-3xl">🚧</span>
      <h2 className="font-heading font-bold text-lg">{title}</h2>
      <p className="text-text-secondary text-sm max-w-sm">
        This screen is on the build roadmap and isn't wired up yet in this milestone.
      </p>
    </div>
  );
}
