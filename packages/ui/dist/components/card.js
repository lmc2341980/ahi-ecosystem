import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '../lib/cn';
export function Card({ className, children, ...props }) {
    return (_jsx("div", { className: cn('rounded-lg border border-neutral-200 bg-white shadow-sm', className), ...props, children: children }));
}
export function CardHeader({ className, children, ...props }) {
    return (_jsx("div", { className: cn('border-b border-neutral-200 px-6 py-4', className), ...props, children: children }));
}
export function CardTitle({ className, children, ...props }) {
    return (_jsx("h3", { className: cn('text-lg font-semibold text-neutral-900', className), ...props, children: children }));
}
export function CardContent({ className, children, ...props }) {
    return (_jsx("div", { className: cn('px-6 py-4', className), ...props, children: children }));
}
export function CardFooter({ className, children, ...props }) {
    return (_jsx("div", { className: cn('border-t border-neutral-200 px-6 py-4', className), ...props, children: children }));
}
//# sourceMappingURL=card.js.map