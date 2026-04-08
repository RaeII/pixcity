import type { HorizonSettings } from "../../scene/types";
import { PanelSection } from "./controls/PanelSection";
import { RangeField } from "./controls/RangeField";

type Props = {
  value: HorizonSettings;
  onChange: (s: HorizonSettings) => void;
};

export function HorizonControls({ value, onChange }: Props) {
  const set = <K extends keyof HorizonSettings>(key: K, val: HorizonSettings[K]) =>
    onChange({ ...value, [key]: val });

  return (
    <div className="space-y-4">
      <PanelSection title="Posição" description="Distância e ajuste fino da silhueta">
        <RangeField
          label="Largura (X)"
          value={value.radiusX}
          min={30}
          max={300}
          step={5}
          onChange={(v) => set("radiusX", v)}
        />
        <RangeField
          label="Profundidade (Z)"
          value={value.radiusZ}
          min={30}
          max={300}
          step={5}
          onChange={(v) => set("radiusZ", v)}
        />
        <RangeField
          label="Ajuste vertical"
          value={value.baseY}
          min={-30}
          max={30}
          step={0.5}
          onChange={(v) => set("baseY", v)}
        />
      </PanelSection>

      <PanelSection title="Quantidade" description="Densidade de edifícios no anel">
        <RangeField
          label="Slots"
          value={value.slots}
          min={20}
          max={300}
          step={10}
          onChange={(v) => set("slots", v)}
        />
        <RangeField
          label="Espaçamento"
          value={value.gapChance}
          min={0}
          max={0.6}
          step={0.01}
          onChange={(v) => set("gapChance", v)}
        />
      </PanelSection>

      <PanelSection title="Altura" description="Intervalo de altura dos edifícios">
        <RangeField
          label="Altura mínima"
          value={value.minHeight}
          min={0.5}
          max={10}
          step={0.5}
          onChange={(v) => set("minHeight", Math.min(v, value.maxHeight - 0.5))}
        />
        <RangeField
          label="Altura máxima"
          value={value.maxHeight}
          min={1}
          max={40}
          step={0.5}
          onChange={(v) => set("maxHeight", Math.max(v, value.minHeight + 0.5))}
        />
      </PanelSection>

      <PanelSection title="Largura" description="Intervalo de largura dos edifícios">
        <RangeField
          label="Largura mínima"
          value={value.minWidth}
          min={1}
          max={15}
          step={0.5}
          onChange={(v) => set("minWidth", Math.min(v, value.maxWidth - 0.5))}
        />
        <RangeField
          label="Largura máxima"
          value={value.maxWidth}
          min={2}
          max={30}
          step={0.5}
          onChange={(v) => set("maxWidth", Math.max(v, value.minWidth + 0.5))}
        />
      </PanelSection>
    </div>
  );
}
