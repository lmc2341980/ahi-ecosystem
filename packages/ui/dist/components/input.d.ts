import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}
export declare function Input({ label, error, hint, className, id, ...props }: InputProps): any;
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}
export declare function Textarea({ label, error, className, id, ...props }: TextareaProps): any;
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    children: ReactNode;
}
export declare function Select({ label, error, className, id, children, ...props }: SelectProps): any;
//# sourceMappingURL=input.d.ts.map