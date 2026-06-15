import { InputHTMLAttributes, forwardRef } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | string[];
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, Props>(({ label, error, hint, className = "", ...props }, ref) => {
  const errMsg = Array.isArray(error) ? error[0] : error;
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium mb-1.5 text-text">{label}</label>}
      <input
        ref={ref}
        className={`w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none bg-surface-2 text-text border
    ${
      errMsg
        ? "border-error focus:border-error/50 focus:ring-2 focus:ring-error/20"
        : "border-border focus:border-accent focus:ring-2 focus:ring-accent/20"
    } ${className}`}
        {...props}
      />
      {hint && !errMsg && <p className="mt-1.5 text-xs text-text-muted">{hint}</p>}
      {errMsg && <p className="mt-1.5 text-xs text-error">{errMsg}</p>}
    </div>
  );
});

Input.displayName = "Input";
export default Input;
