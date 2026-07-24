import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '../lib/cn';
export function Input({ label, error, hint, className, id, ...props }) {
    const inputId = id ?? props.name;
    return (_jsxs("div", { className: "w-full", children: [label && (_jsx("label", { htmlFor: inputId, className: "mb-1.5 block text-sm font-medium text-neutral-700", children: label })), _jsx("input", { id: inputId, className: cn('h-10 w-full rounded-md border bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-0', error
                    ? 'border-error-400 focus:ring-error-500'
                    : 'border-neutral-300 focus:ring-primary-500', className), ...props }), error ? (_jsx("p", { className: "mt-1 text-sm text-error-600", children: error })) : hint ? (_jsx("p", { className: "mt-1 text-sm text-neutral-500", children: hint })) : null] }));
}
export function Textarea({ label, error, className, id, ...props }) {
    const textareaId = id ?? props.name;
    return (_jsxs("div", { className: "w-full", children: [label && (_jsx("label", { htmlFor: textareaId, className: "mb-1.5 block text-sm font-medium text-neutral-700", children: label })), _jsx("textarea", { id: textareaId, className: cn('w-full rounded-md border bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2', error
                    ? 'border-error-400 focus:ring-error-500'
                    : 'border-neutral-300 focus:ring-primary-500', className), ...props }), error && _jsx("p", { className: "mt-1 text-sm text-error-600", children: error })] }));
}
export function Select({ label, error, className, id, children, ...props }) {
    const selectId = id ?? props.name;
    return (_jsxs("div", { className: "w-full", children: [label && (_jsx("label", { htmlFor: selectId, className: "mb-1.5 block text-sm font-medium text-neutral-700", children: label })), _jsx("select", { id: selectId, className: cn('h-10 w-full rounded-md border bg-white px-3 text-sm text-neutral-900 focus:outline-none focus:ring-2', error
                    ? 'border-error-400 focus:ring-error-500'
                    : 'border-neutral-300 focus:ring-primary-500', className), ...props, children: children }), error && _jsx("p", { className: "mt-1 text-sm text-error-600", children: error })] }));
}
//# sourceMappingURL=input.js.map