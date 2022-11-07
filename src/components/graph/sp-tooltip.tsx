import { TooltipWithBounds } from "@visx/tooltip";
import React from "react";
import { EnhancedPoint } from "../../types";

type SpTooltipProps = {
  tooltipData: EnhancedPoint;
  tooltipLeft: number;
  tooltipTop: number;
  tooltipOpen: boolean;
};

const SpTooltip = ({ tooltipOpen, tooltipLeft, tooltipTop, tooltipData }: SpTooltipProps) => {
  return (
    tooltipOpen &&
    tooltipData &&
    tooltipLeft != null &&
    tooltipTop != null && (
      <TooltipWithBounds left={tooltipLeft + 10} top={tooltipTop + 10}>
        <div>
          <strong>{tooltipData.title}</strong> is <strong>{tooltipData.rawDistance}</strong> away
          and has a <strong>{Math.round(tooltipData.y * 100)}</strong> similarity score
        </div>
      </TooltipWithBounds>
    )
  );
};

export { SpTooltip };
