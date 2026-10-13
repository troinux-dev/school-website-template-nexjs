import * as React from "react";
import { cn } from "@/lib/utils";

const control =
  "block w-full min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent aria-[invalid=true]:border-red-600";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...p }, ref) {
    return <input ref={ref} className={cn(control, className)} {...p} />;
  },
);

export function Textarea({ className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-28", className)} {...p} />;
}

export function Select({ className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(control, "pr-10", className)} {...p} />;
}

type FieldProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

export function Field({ label, htmlFor, required, hint, error, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-base font-semibold text-slate-900">
        {label}
        {required ? <span className="text-red-700"> *</span> : <span className="font-normal text-slate-600"> (optional)</span>}
      </label>
      {hint && <p id={`${htmlFor}-hint`} className="text-sm text-slate-600">{hint}</p>}
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
