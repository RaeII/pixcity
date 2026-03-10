import type { SceneStats } from "../../scene/types";

type PanelIntroProps = {
  sceneStats: SceneStats;
  solarIntensity: number;
};

export function PanelIntro({ sceneStats, solarIntensity }: PanelIntroProps) {
  return (
    <section>
      <div className="text-xs uppercase tracking-[0.28em] text-white/45">Personalização</div>
      <h2 className="mt-2 text-lg font-semibold text-white/95">
        Edifícios, material, luz e sombras
      </h2>
      <p className="mt-2 text-xs leading-5 text-white/50">
        {sceneStats.buildings} edifícios ativos em {sceneStats.chunks} chunks.{" "}
        {sceneStats.buildingsWithShadow} edifícios gerando sombra. Intensidade solar atual:{" "}
        {solarIntensity.toFixed(2)}.
      </p>
    </section>
  );
}
