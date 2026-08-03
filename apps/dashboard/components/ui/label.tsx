import { forwardRef, type LabelHTMLAttributes } from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "../../utils/cn";

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <LabelPrimitive.Root
      ref={ref}
      className={cn("text-xs font-medium uppercase tracking-wide text-text-secondary", className)}
      {...props}
    />
  ),
);
Label.displayName = "Label";
