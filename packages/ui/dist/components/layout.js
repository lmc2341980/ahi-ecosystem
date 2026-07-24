import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '../lib/cn';
const sizeStyles = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
};
export function Container({ size = 'lg', className, children, ...props }) {
    return (_jsx("div", { className: cn('mx-auto w-full px-4 sm:px-6 lg:px-8', sizeStyles[size], className), ...props, children: children }));
}
export function PageHeader({ title, description, action, }) {
    return (_jsxs("div", { className: "mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-neutral-900", children: title }), description && _jsx("p", { className: "mt-1 text-sm text-neutral-500", children: description })] }), action && _jsx("div", { className: "flex-shrink-0", children: action })] }));
}
//# sourceMappingURL=layout.js.map