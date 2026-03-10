import type { ReactNode } from "react";

type PanelSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function PanelSection({ title, description, children }: PanelSectionProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 text-sm font-medium text-white/85">{title}</div>
      {description ? (
        <p className="mb-3 text-xs leading-5 text-white/50">{description}</p>
      ) : null}
      {children}
    </section>
  );
}
