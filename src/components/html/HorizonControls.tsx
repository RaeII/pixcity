import { ColorField } from "./controls/ColorField";
import { PanelSection } from "./controls/PanelSection";
import { RangeField } from "./controls/RangeField";
import type { HorizonSettings } from "../../scene/types";

type Props = {
  settings: HorizonSettings;
  onChange: (settings: HorizonSettings) => void;
};

export function HorizonControls({ settings, onChange }: Props) {
  const handleChange = <K extends keyof HorizonSettings>(key: K, value: HorizonSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <PanelSection title="Silhueta do Horizonte">
      <ColorField
        label="Cor da Silhueta"
        value={settings.color}
        onChange={(val) => handleChange("color", val)}
      />
      
      <RangeField
        label="Distância"
        value={settings.distance}
        min={100}
        max={600}
        step={1}
        onChange={(val) => handleChange("distance", val)}
      />
    </PanelSection>
  );
}
