import React, { useState } from "react";
import { Group } from "@visx/group";
import { Circle } from "@visx/shape";
import { GradientPinkBlue } from "@visx/gradient";
import { VoronoiPolygon } from "@visx/voronoi";
import { EnhancedPoint, PointWithTitleAndId } from "../../types";
import { Alert, Intent } from "@blueprintjs/core";
import { useCircles } from "../../hooks/useCircles";
import { SpVoronoiControls } from "./sp-voronoi-controls";
import { circleExplainer } from "../../services/circle-explainer";
import { SpTooltip } from "./sp-tooltip";

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
    handleLinkConfirm,
    handleLinkCancel,
    alertMessage,
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
            const circleDetails = circleExplainer(point.isTop, activeDot?.uid === point.uid);

            return (
              <Circle
                key={`point-${point.x}-${i}`}
                className="dot"
                cx={xScale(point.x)}
                cy={yScale(point.y)}
                r={circleDetails.size}
                opacity={circleDetails.opacity}
                stroke={circleDetails.stroke}
                strokeWidth={circleDetails.strokeWidth}
                fill={circleDetails.fill}
              />
            );
          })}
          {showVoronoi &&
            voronoiLayout.polygons().map((polygon, i) => {
              return (
                <VoronoiPolygon
                  key={`polygon-${i}`}
                  polygon={polygon}
                  fill="white"
                  stroke="white"
                  strokeWidth={1}
                  strokeOpacity={0.2}
                  fillOpacity={tooltipData?.uid === polygon.data.uid ? 0.5 : 0}
                />
              );
            })}
        </Group>
      </svg>
      <SpTooltip
        tooltipOpen={tooltipOpen}
        tooltipLeft={tooltipLeft}
        tooltipTop={tooltipTop}
        tooltipData={tooltipData}
      ></SpTooltip>
      <SpVoronoiControls showVoronoi={showVoronoi} setShowVoronoi={setShowVoronoi} />
      <Alert
        cancelButtonText="cancel"
        confirmButtonText="link pages ✨"
        icon="new-link"
        intent={Intent.SUCCESS}
        isOpen={!!alertMessage}
        onCancel={handleLinkCancel}
        onConfirm={handleLinkConfirm}
      >
        <p>{alertMessage}</p>
      </Alert>
    </div>
  );
};

export default SpDots;
