import { Button, buttonVariants } from "@/components/ui/button";
import { VariantProps } from "class-variance-authority";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReactNode } from "react";

interface ButtonWithTooltipProps
  extends React.ComponentPropsWithoutRef<"button">,
    VariantProps<typeof buttonVariants> {
  tooltip: string;
  children: ReactNode;
}

export function ButtonWithTooltip({
  tooltip,
  children,
  variant,
  size,
  ...props
}: ButtonWithTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={variant} size={size} {...props}>{children}</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
