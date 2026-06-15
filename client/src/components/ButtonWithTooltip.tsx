import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReactNode } from "react";

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

interface ButtonWithTooltipProps extends ButtonProps {
  tooltip: string;
  children: ReactNode;
}

export function ButtonWithTooltip({
  tooltip,
  children,
  ...props
}: ButtonWithTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button {...props}>{children}</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
