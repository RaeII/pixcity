type ColorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function ColorField({ label, value, onChange, placeholder }: ColorFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-white/75">{label}</span>
      <div className="flex flex-col gap-3">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full cursor-pointer rounded-lg border border-white/10 bg-transparent p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
        />
      </div>
    </label>
  );
}
