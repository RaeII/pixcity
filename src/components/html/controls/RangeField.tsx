type RangeFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  valueLabel?: string;
};

export function RangeField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  valueLabel,
}: RangeFieldProps) {
  return (
    <label className="mt-4 block first:mt-0">
      <div className="mb-2 flex items-center justify-between text-sm text-white/75">
        <span>{label}</span>
        <span className="text-white/50">{valueLabel ?? value.toString()}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-white"
      />
    </label>
  );
}
