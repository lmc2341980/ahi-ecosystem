import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { cn } from '../lib/cn';
export function Spinner({ className, ...props }) {
    return (_jsxs("svg", { className: cn('h-5 w-5 animate-spin text-primary-600', className), xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", ...props, children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }));
}
export function LoadingOverlay({ children, loading }) {
    if (!loading)
        return _jsx(_Fragment, { children: children });
    return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(Spinner, { className: "h-8 w-8" }) }));
}
export function EmptyState({ title, description, action, }) {
    return (_jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-center", children: [_jsx("h3", { className: "text-lg font-semibold text-neutral-900", children: title }), description && _jsx("p", { className: "mt-1 text-sm text-neutral-500", children: description }), action && _jsx("div", { className: "mt-4", children: action })] }));
}
//# sourceMappingURL=spinner.js.map