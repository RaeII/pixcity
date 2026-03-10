type NumberFieldProps = {
  label: string;
  value: number | string;
  onChange?: (value: number) => void;
  step?: number;
  readOnly?: boolean;
};

export function NumberField({
  label,
  value,
  onChange,
  step,
  readOnly = false,
}: NumberFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-white/75">{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        readOnly={readOnly}
        onChange={
          onChange
            ? (event) => {
                onChange(Number(event.target.value));
              }
            : undefined
        }
        className={`h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-white/20 ${
          readOnly ? "text-white/70" : "text-white"
        }`}
      />
    </label>
  );
}
