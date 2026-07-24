import type { HTMLAttributes, ReactNode } from 'react';
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}
export declare function Card({ className, children, ...props }: CardProps): any;
export declare function CardHeader({ className, children, ...props }: CardProps): any;
export declare function CardTitle({ className, children, ...props }: CardProps): any;
export declare function CardContent({ className, children, ...props }: CardProps): any;
export declare function CardFooter({ className, children, ...props }: CardProps): any;
//# sourceMappingURL=card.d.ts.map