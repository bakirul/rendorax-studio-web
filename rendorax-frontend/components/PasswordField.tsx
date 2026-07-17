"use client";

import {
  useState,
  type InputHTMLAttributes,
  type Ref,
} from "react";
import { Eye, EyeOff } from "lucide-react";

export type PasswordFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  inputRef?: Ref<HTMLInputElement>;
};

/**
 * Presentation-only password input with show/hide toggle.
 * Does not alter auth logic, validation, or submitted values.
 */
export default function PasswordField({
  className = "",
  disabled,
  inputRef,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <input
        {...props}
        ref={inputRef}
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={`${className} pr-12`.trim()}
      />
      <button
        type="button"
        tabIndex={0}
        disabled={disabled}
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex items-center justify-center min-w-[44px] min-h-[44px] px-2 text-text-gray hover:text-gold-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-black disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        {visible ? (
          <EyeOff size={16} aria-hidden="true" />
        ) : (
          <Eye size={16} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
