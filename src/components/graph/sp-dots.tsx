import React, { useMemo, useState, useCallback, useRef } from "react";
import { Group } from "@visx/group";
import { Circle } from "@visx/shape";
import { GradientPinkBlue } from "@visx/gradient";
import { scaleLinear } from "@visx/scale";
import { withTooltip, TooltipWithBounds } from "@visx/tooltip";
import { WithTooltipProvidedProps } from "@visx/tooltip/lib/enhancers/withTooltip";
import { voronoi, VoronoiPolygon } from "@visx/voronoi";
import { localPoint } from "@visx/event";
import { EnhancedPoint } from "../../types";

const BASE_R = 2;
const CIRCLE_RESIZE_FACTOR = 3;

type DotsProps = {
  width: number;
  height: number;
  showControls?: boolean;
  graphData: EnhancedPoint[];
};

let tooltipTimeout: number;

export default withTooltip<DotsProps, EnhancedPoint>(
  ({
    width,
    height,
    showControls = true,
    hideTooltip,
    showTooltip,
    tooltipOpen,
    tooltipData,
    tooltipLeft,
    tooltipTop,
    graphData,
  }: DotsProps & WithTooltipProvidedProps<EnhancedPoint>) => {
    if (width < 10) return null;

    const minX = Math.min(...graphData.map((point) => point.x));
    const maxX = Math.max(...graphData.map((point) => point.x));
    const minY = Math.min(...graphData.map((point) => point.y));
    const maxY = Math.max(...graphData.map((point) => point.y));

    const xPadding = (maxX - minX) * 0.05;
    const yPadding = (maxY - minY) * 0.05;

    const minXWithPadding = minX - xPadding;
    const minYWithPadding = minY - yPadding;
    const maxXWithPadding = maxX + xPadding;
    const maxYWithPadding = maxY + yPadding;

    const [showVoronoi, setShowVoronoi] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);
    const xScale = useMemo(
      () =>
        scaleLinear<number>({
          domain: [minXWithPadding, maxXWithPadding],
          range: [0, width],
          clamp: true,
        }),
      [width]
    );
    const yScale = useMemo(
      () =>
        scaleLinear<number>({
          domain: [minYWithPadding, maxYWithPadding],
          range: [height, 0],
          clamp: true,
        }),
      [height]
    );
    const voronoiLayout = useMemo(
      () =>
        voronoi<EnhancedPoint>({
          x: (d) => xScale(d.x) ?? 0,
          y: (d) => yScale(d.y) ?? 0,
          width,
          height,
        })(graphData),
      [width, height, xScale, yScale]
    );

    const handleMouseMove = useCallback(
      (event: React.MouseEvent | React.TouchEvent) => {
        if (tooltipTimeout) clearTimeout(tooltipTimeout);
        if (!svgRef.current) return;

        const point = localPoint(svgRef.current, event);
        if (!point) return;
        const neighborRadius = 100;
        const closest = voronoiLayout.find(point.x, point.y, neighborRadius);
        if (closest) {
          showTooltip({
            tooltipLeft: xScale(closest.data.x),
            tooltipTop: yScale(closest.data.y),
            tooltipData: closest.data,
          });
        }
      },
      [xScale, yScale, showTooltip, voronoiLayout]
    );

    const handleMouseLeave = useCallback(() => {
      tooltipTimeout = window.setTimeout(() => {
        hideTooltip();
      }, 10);
    }, [hideTooltip]);

    return (
      <div>
        <svg width={width} height={height} ref={svgRef}>
          <GradientPinkBlue id="dots-pink" rotate={45} x1={-0.5} x2={0} y1={0} y2={1} />
          <rect
            width={width}
            height={height}
            rx={14}
            fill="url(#dots-pink)"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseLeave}
          />
          <Group pointerEvents="none">
            {graphData.map((point, i) => {
              const xPoint = point.x;
              const yPoint = point.y;
              const size = BASE_R + (point.isTop ? CIRCLE_RESIZE_FACTOR : 0);
              const opacity = point.isTop ? 1 : 0.5;
              const isTooltip = tooltipData?.x === point.x && tooltipData?.y === point.y;

              {
                /* TODO a click to dialog to confirm a link to apex if not already a neighbor */
              }

              return (
                <Circle
                  key={`point-${point.x}-${i}`}
                  className="dot"
                  cx={xScale(xPoint)}
                  cy={yScale(yPoint)}
                  r={size}
                  opacity={opacity}
                  fill={isTooltip ? "white" : "#f6c431"}
                />
              );
            })}
            {showVoronoi &&
              voronoiLayout.polygons().map((polygon, i) => {
                const isTooltip =
                  tooltipData?.x === polygon.data.x && tooltipData?.y === polygon.data.y;
                return (
                  <VoronoiPolygon
                    key={`polygon-${i}`}
                    polygon={polygon}
                    fill="white"
                    stroke="white"
                    strokeWidth={1}
                    strokeOpacity={0.2}
                    fillOpacity={isTooltip ? 0.5 : 0}
                  />
                );
              })}
          </Group>
        </svg>
        {tooltipOpen && tooltipData && tooltipLeft != null && tooltipTop != null && (
          <TooltipWithBounds left={tooltipLeft + 10} top={tooltipTop + 10}>
            <div>
              <strong>{tooltipData.title}</strong> is <strong>{tooltipData.rawDistance}</strong>{" "}
              away and has a <strong>{Math.round(tooltipData.y * 100)}</strong> similarity score
            </div>
          </TooltipWithBounds>
        )}
        {showControls && (
          <div>
            <label style={{ fontSize: 12 }}>
              <input
                type="checkbox"
                checked={showVoronoi}
                onChange={() => setShowVoronoi(!showVoronoi)}
              />
              &nbsp;Show voronoi point map
            </label>
          </div>
        )}
      </div>
    );
  }
);
