import type { HTMLAttributes, ReactNode } from 'react';
export declare function Spinner({ className, ...props }: HTMLAttributes<SVGSVGElement>): any;
export interface LoadingOverlayProps {
    children?: ReactNode;
    loading: boolean;
}
export declare function LoadingOverlay({ children, loading }: LoadingOverlayProps): any;
export declare function EmptyState({ title, description, action, }: {
    title: string;
    description?: string;
    action?: ReactNode;
}): any;
//# sourceMappingURL=spinner.d.ts.map