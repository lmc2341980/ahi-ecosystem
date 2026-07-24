import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '../lib/cn';
const variantStyles = {
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    error: 'bg-error-100 text-error-800',
    neutral: 'bg-neutral-100 text-neutral-800',
};
export function Badge({ variant = 'neutral', className, children, ...props }) {
    return (_jsx("span", { className: cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variantStyles[variant], className), ...props, children: children }));
}
//# sourceMappingURL=badge.js.map