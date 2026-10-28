import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import * as ProgressPrimitive from "@radix-ui/react-progress";
const progressVariants = cva("w-full overflow-hidden rounded-sm bg-secondary", {
  variants: { size: { default: "h-1", compact: "h-0.5" } },
  defaultVariants: { size: "default" },
});
type ProgressProps = Omit<
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
  "children"
> &
  VariantProps<typeof progressVariants> & { value: number; max?: number };
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, size, value, max = 100, ...props }, ref) => (
    <ProgressPrimitive.Root
      ref={ref}
      value={value}
      max={max}
      className={cn(progressVariants({ size }), className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full bg-primary"
        style={{
          transform: `translateX(-${100 - Math.max(0, Math.min(100, (value / max) * 100))}%)`,
        }}
      />
    </ProgressPrimitive.Root>
  ),
);
Progress.displayName = "Progress";
export { Progress };
