import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const appleIconVariants = cva("shrink-0 transition-all", {
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

function AppleIcon({
  className,
  variant = "default",
  shape = "default",
  size = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof appleIconVariants>) {
  return (
    <div className={cn(appleIconVariants({ variant, shape, size, className }))} {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="size-full"
        fill="currentColor"
        aria-label="Apple"
      >
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
      </svg>
    </div>
  );
}

export { AppleIcon, appleIconVariants };
