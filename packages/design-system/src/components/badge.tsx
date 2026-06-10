import { forwardRef } from "react";
import { cn } from "../utils";

export const badgeVariants = {
  variant: {
    default: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    destructive: "border-transparent bg-destructive text-destructive-foreground",
    outline: "text-foreground",
    success: "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    warning: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  },
} as const;

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants.variant;
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        badgeVariants.variant[variant],
        className,
      )}
      {...props}
    />
  ),
);
Badge.displayName = "Badge";
