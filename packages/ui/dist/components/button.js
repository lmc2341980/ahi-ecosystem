import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '../lib/cn';
const variantStyles = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus-visible:ring-secondary-500',
    outline: 'border border-neutral-300 bg-transparent text-neutral-700 hover:bg-neutral-50 focus-visible:ring-primary-500',
    ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100 focus-visible:ring-neutral-400',
    danger: 'bg-error-600 text-white hover:bg-error-700 focus-visible:ring-error-500',
};
const sizeStyles = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
};
export function Button({ variant = 'primary', size = 'md', loading = false, disabled, className, children, ...props }) {
    return (_jsxs("button", { className: cn('inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50', variantStyles[variant], sizeStyles[size], className), disabled: disabled || loading, ...props, children: [loading && (_jsxs("svg", { className: "mr-2 h-4 w-4 animate-spin", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] })), children] }));
}
//# sourceMappingURL=button.js.map