import type { InputHTMLAttributes } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  errors?: string[];
};

export function FormField({ label, errors, ...props }: FormFieldProps) {
  return (
    <label className="space-y-2 text-sm text-slate-200">
      <span className="font-medium">{label}</span>
      <input
        {...props}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
      />
      {errors?.length ? (
        <div className="space-y-1 text-xs text-rose-300">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}
    </label>
  );
}
