import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const microsoftIconVariants = cva("shrink-0 transition-all", {
  variants: {
    variant: {
      default: "",
      light: "bg-white",
      dark: "bg-gray-900",
      transparent: "bg-transparent",
    },
    shape: {
      default: "rounded",
      square: "rounded-none",
      rounded: "rounded-full",
    },
    size: {
      sm: "size-6 p-1",
      default: "size-10 p-2",
      lg: "size-14 p-3",
      xl: "size-20 p-4",
    },
  },
  defaultVariants: {
    variant: "default",
    shape: "default",
    size: "default",
  },
});

function MicrosoftIcon({
  className,
  variant = "default",
  shape = "default",
  size = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof microsoftIconVariants>) {
  return (
    <div className={cn(microsoftIconVariants({ variant, shape, size, className }))} {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="size-full"
        aria-label="Microsoft"
      >
        <path fill="#F25022" d="M1 1h10v10H1z" />
        <path fill="#00A4EF" d="M1 13h10v10H1z" />
        <path fill="#7FBA00" d="M13 1h10v10H13z" />
        <path fill="#FFB900" d="M13 13h10v10H13z" />
      </svg>
    </div>
  );
}

export { MicrosoftIcon, microsoftIconVariants };
