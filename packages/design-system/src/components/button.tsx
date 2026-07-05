import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../utils";

/**
 * Button variant + size class maps.
 *
 * `buttonVariants` is ALSO exposed as a callable function (matching the
 * `cva` / shadcn convention) so that other components (alert-dialog,
 * dropdown-menu, etc.) can call `buttonVariants()` or
 * `buttonVariants({ variant: "outline" })` to get the class string.
 *
 * The function form is a separate export (`buttonVariantsFn`) to preserve
 * the object form (`buttonVariants.variant[x]`) used by the Button component
 * itself and by code that reads the variant catalog.
 */
const buttonVariantMap = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline:
    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
} as const;

const buttonSizeMap = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "h-10 w-10",
} as const;

export const buttonVariants = Object.assign(
  /**
   * Callable form: `buttonVariants()` or `buttonVariants({ variant, size })`.
   * Returns the concatenated class string. Matches the shadcn/cva convention
   * so alert-dialog, dropdown-menu, etc. can call it.
   */
  (opts?: {
    variant?: keyof typeof buttonVariantMap;
    size?: keyof typeof buttonSizeMap;
  }) => {
    const v = opts?.variant ?? "default";
    const s = opts?.size ?? "default";
    return cn(buttonVariantMap[v], buttonSizeMap[s]);
  },
  {
    variant: buttonVariantMap,
    size: buttonSizeMap,
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariantMap;
  size?: keyof typeof buttonSizeMap;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          buttonVariantMap[variant],
          buttonSizeMap[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
