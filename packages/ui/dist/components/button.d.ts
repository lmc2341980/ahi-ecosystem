import type { ButtonHTMLAttributes, ReactNode } from 'react';
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    children: ReactNode;
}
export declare function Button({ variant, size, loading, disabled, className, children, ...props }: ButtonProps): any;
//# sourceMappingURL=button.d.ts.map