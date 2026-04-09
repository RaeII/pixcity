import { useState } from "react";
import type { HorizonSegment, HorizonSettings } from "../../scene/types";
import { CheckboxField } from "./controls/CheckboxField";
import { PanelSection } from "./controls/PanelSection";
import { RangeField } from "./controls/RangeField";

const SEGMENT_LABELS = ["Arco Norte", "Arco Leste", "Arco Sul", "Arco Oeste"] as const;

type Props = {
  value: HorizonSettings;
  onChange: (s: HorizonSettings) => void;
};

function SegmentControls({
  label,
  seg,
  onSegChange,
}: {
  label: string;
  seg: HorizonSegment;
  onSegChange: (s: HorizonSegment) => void;
}) {
  const [open, setOpen] = useState(true);
  const set = <K extends keyof HorizonSegment>(key: K, val: HorizonSegment[K]) =>
    onSegChange({ ...seg, [key]: val });

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/5"
      >
        <span>{label}</span>
        <span className="text-white/40">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-white/10 px-3 pb-3 pt-2 space-y-0">
          <CheckboxField
            label="Ativo"
            checked={seg.enabled}
            onChange={(v) => set("enabled", v)}
          />
          <RangeField
            label="Raio"
            value={seg.radius}
            min={50}
            max={400}
            step={5}
            onChange={(v) => set("radius", v)}
          />
          <RangeField
            label="Curvatura"
            value={seg.curvature}
            min={-150}
            max={150}
            step={1}
            onChange={(v) => set("curvature", v)}
          />
          <RangeField
            label="Offset X"
            value={seg.offsetX}
            min={-100}
            max={100}
            step={1}
            onChange={(v) => set("offsetX", v)}
          />
          <RangeField
            label="Offset Z"
            value={seg.offsetZ}
            min={-100}
            max={100}
            step={1}
            onChange={(v) => set("offsetZ", v)}
          />
          <RangeField
            label="Offset vertical"
            value={seg.baseY}
            min={-10}
            max={20}
            step={0.5}
            onChange={(v) => set("baseY", v)}
          />
          <RangeField
            label="Slots"
            value={seg.slots}
            min={10}
            max={200}
            step={5}
            onChange={(v) => set("slots", v)}
          />
        </div>
      )}
    </div>
  );
}

export function HorizonControls({ value, onChange }: Props) {
  const setGlobal = <K extends keyof Omit<HorizonSettings, "segments">>(
    key: K,
    val: HorizonSettings[K],
  ) => onChange({ ...value, [key]: val });

  const setSegment = (index: number, seg: HorizonSegment) => {
    const segments = [...value.segments] as typeof value.segments;
    segments[index] = seg;
    onChange({ ...value, segments });
  };

  return (
    <div className="space-y-4">
      <PanelSection title="Edifícios" description="Parâmetros globais de todos os arcos">
        <RangeField
          label="Altura mínima"
          value={value.minHeight}
          min={0.5}
          max={10}
          step={0.5}
          onChange={(v) => setGlobal("minHeight", Math.min(v, value.maxHeight - 0.5))}
        />
        <RangeField
          label="Altura máxima"
          value={value.maxHeight}
          min={1}
          max={40}
          step={0.5}
          onChange={(v) => setGlobal("maxHeight", Math.max(v, value.minHeight + 0.5))}
        />
        <RangeField
          label="Largura mínima"
          value={value.minWidth}
          min={1}
          max={15}
          step={0.5}
          onChange={(v) => setGlobal("minWidth", Math.min(v, value.maxWidth - 0.5))}
        />
        <RangeField
          label="Largura máxima"
          value={value.maxWidth}
          min={2}
          max={30}
          step={0.5}
          onChange={(v) => setGlobal("maxWidth", Math.max(v, value.minWidth + 0.5))}
        />
        <RangeField
          label="Espaçamento"
          value={value.gapChance}
          min={0}
          max={0.6}
          step={0.01}
          onChange={(v) => setGlobal("gapChance", v)}
        />
      </PanelSection>

      <div className="space-y-2">
        {SEGMENT_LABELS.map((label, i) => (
          <SegmentControls
            key={i}
            label={label}
            seg={value.segments[i]}
            onSegChange={(seg) => setSegment(i, seg)}
          />
        ))}
      </div>
    </div>
  );
}
