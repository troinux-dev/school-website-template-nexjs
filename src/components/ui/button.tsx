import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg hover:opacity-90",
        accent: "bg-accent text-accent-fg hover:brightness-95",
        outline: "border-2 border-primary-ink bg-white text-primary-ink hover:bg-primary-soft",
        outlineLight: "border-2 border-white/80 bg-transparent text-white hover:bg-white/10",
        ghost: "text-primary-ink hover:bg-primary-soft",
        danger: "bg-red-700 text-white hover:bg-red-800",
        dangerGhost: "text-red-700 hover:bg-red-50",
      },
      size: {
        md: "",
        sm: "min-h-11 px-4 py-2 text-sm",
        full: "w-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
