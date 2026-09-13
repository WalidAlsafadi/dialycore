import * as React from "react";
import { cn } from "../../lib/utils";

interface BadgeProps {
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default:
      "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 shadow-sm",
    secondary:
      "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
    destructive:
      "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-sm",
    outline: "text-foreground border-primary/30 bg-primary/5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
export type { BadgeProps };
