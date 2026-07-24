import type { HTMLAttributes, ReactNode } from 'react';
export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    children: ReactNode;
}
export declare function Badge({ variant, className, children, ...props }: BadgeProps): any;
//# sourceMappingURL=badge.d.ts.map