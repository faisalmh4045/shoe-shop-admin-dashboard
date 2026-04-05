"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePermissions } from "@/hooks/usePermissions";

export type MutateButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "disabled"
> & {
  loading?: boolean;
};

export function MutateButton({
  children,
  loading,
  ...buttonProps
}: MutateButtonProps) {
  const { can } = usePermissions();
  const canMutate = can("mutate");
  const disabled = !canMutate || Boolean(loading);

  const button = (
    <Button {...buttonProps} disabled={disabled}>
      {children}
    </Button>
  );

  if (!canMutate) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-not-allowed">{button}</span>
        </TooltipTrigger>
        <TooltipContent>Read-only access</TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
