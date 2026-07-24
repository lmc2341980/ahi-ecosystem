import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-neutral-700"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'h-10 w-full rounded-md border bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-error-400 focus:ring-error-500'
            : 'border-neutral-300 focus:ring-primary-500',
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="mt-1 text-sm text-error-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-sm text-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const textareaId = id ?? props.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="mb-1.5 block text-sm font-medium text-neutral-700"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'w-full rounded-md border bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2',
          error
            ? 'border-error-400 focus:ring-error-500'
            : 'border-neutral-300 focus:ring-primary-500',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-error-600">{error}</p>}
    </div>
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export function Select({ label, error, className, id, children, ...props }: SelectProps) {
  const selectId = id ?? props.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-neutral-700"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'h-10 w-full rounded-md border bg-white px-3 text-sm text-neutral-900 focus:outline-none focus:ring-2',
          error
            ? 'border-error-400 focus:ring-error-500'
            : 'border-neutral-300 focus:ring-primary-500',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-sm text-error-600">{error}</p>}
    </div>
  );
}
