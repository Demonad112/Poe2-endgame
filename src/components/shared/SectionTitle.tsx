export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 border-b border-white/10 pb-2 text-lg font-semibold text-slate-200">
      <span className="size-1.5 rounded-full bg-[var(--accent)]" />
      {children}
    </h2>
  );
}
