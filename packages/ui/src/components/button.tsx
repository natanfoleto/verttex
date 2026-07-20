import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={twMerge(
          clsx(
            "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 px-4 py-2 h-10 cursor-pointer",
            {
              "bg-primary text-primary-foreground hover:bg-primary/90":
                variant === "default",
              "border border-input bg-background hover:bg-accent hover:text-accent-foreground":
                variant === "outline",
              "hover:bg-accent hover:text-accent-foreground":
                variant === "ghost",
            },
            className,
          ),
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
