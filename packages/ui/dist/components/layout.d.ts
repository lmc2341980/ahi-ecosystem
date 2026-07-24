import type { HTMLAttributes, ReactNode } from 'react';
export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}
export declare function Container({ size, className, children, ...props }: ContainerProps): any;
export declare function PageHeader({ title, description, action, }: {
    title: string;
    description?: string;
    action?: ReactNode;
}): any;
//# sourceMappingURL=layout.d.ts.map