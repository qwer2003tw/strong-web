"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "flex w-full items-center gap-3 rounded-md border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        info: "border-blue-100 bg-blue-50 text-blue-700",
        warning: "border-amber-200 bg-amber-50 text-amber-700",
        success: "border-emerald-200 bg-emerald-50 text-emerald-700",
        error: "border-rose-200 bg-rose-50 text-rose-700",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

interface AlertProps extends VariantProps<typeof alertVariants> {
  message: string;
  className?: string;
}

export function Alert({ message, variant, className }: AlertProps) {
  return <div className={cn(alertVariants({ variant }), className)}>{message}</div>;
}
