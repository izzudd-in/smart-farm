import type {
  InputHTMLAttributes,
  ReactNode,
} from "react";
import { HelpCircle } from "lucide-react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: ReactNode;
  tooltip?: string;
  error?: string;
  startIcon?: ReactNode;
  endAdornment?: ReactNode;
};

export function Input({
  label,
  helperText,
  tooltip,
  error,
  startIcon,
  endAdornment,
  className = "",
  id,
  name,
  ...props
}: InputProps) {
  const inputId = id ?? name;
  const errorId = inputId ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <div className="flex items-center gap-1.5">
          <label
            htmlFor={inputId}
            className="text-[13px] font-medium text-foreground"
          >
            {label}
          </label>
          {tooltip ? (
            <span
              className="inline-flex cursor-help text-muted hover:text-foreground"
              title={tooltip}
              aria-label={tooltip}
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="relative flex items-center">
        {startIcon ? (
          <span className="pointer-events-none absolute left-3 flex text-muted">
            {startIcon}
          </span>
        ) : null}

        <input
          id={inputId}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={[
            "h-11 w-full rounded-[10px] bg-white text-sm text-foreground",
            "border transition-all outline-none",
            "placeholder:text-muted-light",
            "focus:border-primary focus:ring-2 focus:ring-primary/15",
            "disabled:bg-[#F3F4F6] disabled:text-muted",
            error
              ? "border-danger focus:border-danger focus:ring-danger/10"
              : "border-border",
            startIcon ? "pl-10" : "pl-3",
            endAdornment ? "pr-11" : "pr-3",
            className,
          ].join(" ")}
          {...props}
        />

        {endAdornment ? (
          <div className="absolute right-2 flex items-center">
            {endAdornment}
          </div>
        ) : null}
      </div>

      {error ? (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-muted">{helperText}</p>
      ) : null}
    </div>
  );
}