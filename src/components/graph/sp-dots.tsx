import React, { useMemo, useState, useCallback, useRef } from "react";
import { Group } from "@visx/group";
import { Circle } from "@visx/shape";
import { GradientPinkRed } from "@visx/gradient";
import { scaleLinear } from "@visx/scale";
import { withTooltip, Tooltip } from "@visx/tooltip";
import { WithTooltipProvidedProps } from "@visx/tooltip/lib/enhancers/withTooltip";
import { voronoi, VoronoiPolygon } from "@visx/voronoi";
import { localPoint } from "@visx/event";
import { Point, PointsRange } from "../../types";
import { genRandomNormalPoints } from "@visx/mock-data";

// const points: PointsRange[] = genRandomNormalPoints(600, /* seed= */ 0.5).filter((_, i) => i < 600);

const x = (d: PointsRange) => d[0];
const y = (d: PointsRange) => d[1];

type DotsProps = {
  width: number;
  height: number;
  showControls?: boolean;
  graphData: Point[];
};

let tooltipTimeout: number;

export default withTooltip<DotsProps, PointsRange>(
  ({
    width,
    height,
    // TODO fix the voronoi
    showControls = true,
    hideTooltip,
    showTooltip,
    tooltipOpen,
    tooltipData,
    tooltipLeft,
    tooltipTop,
    graphData,
  }: DotsProps & WithTooltipProvidedProps<PointsRange>) => {
    if (width < 10) return null;

    const pointsForGraph: PointsRange[] = graphData.map((point) => {
      return [point.x, point.y, undefined];
    });

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

    const [showVoronoi, setShowVoronoi] = useState(showControls);
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
        voronoi<PointsRange>({
          x: (d) => xScale(x(d)) ?? 0,
          y: (d) => yScale(y(d)) ?? 0,
          width,
          height,
        })(pointsForGraph),
      [width, height, xScale, yScale]
    );

    // event handlers
    const handleMouseMove = useCallback(
      (event: React.MouseEvent | React.TouchEvent) => {
        if (tooltipTimeout) clearTimeout(tooltipTimeout);
        if (!svgRef.current) return;

        // find the nearest polygon to the current mouse position
        const point = localPoint(svgRef.current, event);
        if (!point) return;
        const neighborRadius = 100;
        const closest = voronoiLayout.find(point.x, point.y, neighborRadius);
        if (closest) {
          // TODO tooltip on right edge causes jitter
          showTooltip({
            tooltipLeft: xScale(x(closest.data)),
            tooltipTop: yScale(y(closest.data)),
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
          <GradientPinkRed id="dots-pink" />
          {/** capture all mouse events with a rect */}
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
            {pointsForGraph.map((point, i) => (
              <Circle
                key={`point-${point[0]}-${i}`}
                className="dot"
                cx={xScale(x(point))}
                cy={yScale(y(point))}
                r={i % 3 === 0 ? 2 : 3}
                fill={tooltipData === point ? "white" : "#f6c431"}
              />
            ))}
            {showVoronoi &&
              voronoiLayout
                .polygons()
                .map((polygon, i) => (
                  <VoronoiPolygon
                    key={`polygon-${i}`}
                    polygon={polygon}
                    fill="white"
                    stroke="white"
                    strokeWidth={1}
                    strokeOpacity={0.2}
                    fillOpacity={tooltipData === polygon.data ? 0.5 : 0}
                  />
                ))}
          </Group>
        </svg>
        {tooltipOpen && tooltipData && tooltipLeft != null && tooltipTop != null && (
          <Tooltip left={tooltipLeft + 10} top={tooltipTop + 10}>
            <div>
              <strong>x:</strong> {x(tooltipData)}
            </div>
            <div>
              <strong>y:</strong> {y(tooltipData)}
            </div>
          </Tooltip>
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
