import React, { useState } from "react";
import { Group } from "@visx/group";
import { Circle } from "@visx/shape";
import { GradientPinkBlue } from "@visx/gradient";
import { TooltipWithBounds } from "@visx/tooltip";
import { VoronoiPolygon } from "@visx/voronoi";
import { EnhancedPoint, PointWithTitleAndId } from "../../types";
import { Alert, Intent } from "@blueprintjs/core";
import { useCircles } from "../../hooks/useCircles";

const BASE_R = 2;
const CIRCLE_RESIZE_FACTOR = 3;

type DotsProps = {
  width: number;
  height: number;
  graphData: EnhancedPoint[];
  apexData: PointWithTitleAndId;
};

const SpDots = ({ width, height, graphData, apexData }: DotsProps) => {
  const {
    svgRef,
    handleMouseMove,
    handleMouseLeave,
    circleClick,
    activeDot,
    xScale,
    yScale,
    voronoiLayout,
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    linkAlertIsOpen,
    handleLinkConfirm,
    handleLinkCancel,
    tooltipMessage,
  } = useCircles(graphData, apexData, width, height);

  const [showVoronoi, setShowVoronoi] = useState(false);

  return width < 10 ? null : (
    <div style={{ position: "relative" }}>
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
          onClick={circleClick}
          style={{ cursor: "pointer" }}
        />
        <Group pointerEvents="none">
          {graphData.map((point, i) => {
            const xPoint = point.x;
            const yPoint = point.y;
            const size = BASE_R + (point.isTop ? CIRCLE_RESIZE_FACTOR : 0);
            const opacity = point.isTop ? 1 : 0.5;
            const isActive = activeDot?.x === point.x && activeDot?.y === point.y;
            const stroke = isActive ? "#00079c" : "transparent";
            const strokeWidth = isActive ? 3 : 0;
            const fill = isActive ? "#00ff4e" : "#f6c431";
            return (
              <Circle
                key={`point-${point.x}-${i}`}
                className="dot"
                cx={xScale(xPoint)}
                cy={yScale(yPoint)}
                r={size}
                opacity={opacity}
                stroke={stroke}
                strokeWidth={strokeWidth}
                fill={fill}
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
            <strong>{tooltipData.title}</strong> is <strong>{tooltipData.rawDistance}</strong> away
            and has a <strong>{Math.round(tooltipData.y * 100)}</strong> similarity score
          </div>
        </TooltipWithBounds>
      )}
      {
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
      }
      <Alert
        cancelButtonText="cancel"
        confirmButtonText="link pages ✨"
        icon="new-link"
        intent={Intent.SUCCESS}
        isOpen={linkAlertIsOpen}
        onCancel={handleLinkCancel}
        onConfirm={handleLinkConfirm}
      >
        <p>{tooltipMessage}</p>
      </Alert>
    </div>
  );
};

export default SpDots;
