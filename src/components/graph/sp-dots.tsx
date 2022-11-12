import React, { useState } from "react";
import { Group } from "@visx/group";
import { Circle } from "@visx/shape";
import { VoronoiPolygon } from "@visx/voronoi";
import { EnhancedPoint, PointWithTitleAndId } from "../../types";
import { Alert } from "@blueprintjs/core";
import { useCircles } from "../../hooks/useCircles";
import { SpVoronoiControls } from "./sp-voronoi-controls";
import { circleExplainer } from "../../services/circle-explainer";
import { SpTooltip } from "./sp-tooltip";
import { SP_LINEAR_GRADIENT, SP_LINEAR_GRADIENT_ID } from "../../constants";

type DotsProps = {
  width: number;
  height: number;
  graphData: EnhancedPoint[];
  apexData: PointWithTitleAndId;
  markPageLinked: (pageId: string) => void;
};

const SpDots = ({ width, height, graphData, apexData, markPageLinked }: DotsProps) => {
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
    alertProps,
  } = useCircles(graphData, apexData, width, height, markPageLinked);

  const [showVoronoi, setShowVoronoi] = useState(false);

  return width < 10 ? null : (
    <div style={{ position: "relative" }}>
      <svg width={width} height={height} ref={svgRef}>
        {SP_LINEAR_GRADIENT}
        <rect
          width={width}
          height={height}
          rx={14}
          fill={`url(#${SP_LINEAR_GRADIENT_ID})`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseLeave}
          onClick={circleClick}
          style={{ cursor: "pointer" }}
        />
        <Group pointerEvents="none">
          {graphData.map((point, i) => {
            const circleDetails = circleExplainer(point, activeDot?.uid);

            return (
              <Circle
                key={`point-${i}`}
                className="dot"
                cy={yScale(point.y)}
                cx={xScale(point.x)}
                r={circleDetails.size}
                opacity={circleDetails.opacity}
                stroke={circleDetails.stroke}
                strokeWidth={circleDetails.strokeWidth}
                fill={circleDetails.fill}
                z={circleDetails.z}
              />
            );
          })}
          {showVoronoi &&
            voronoiLayout.polygons().map((polygon, i) => {
              const tooltipOpacity = tooltipData?.uid === polygon.data.uid ? 0.5 : 0;

              return (
                <VoronoiPolygon
                  key={`polygon-${i}`}
                  polygon={polygon}
                  fill="white"
                  stroke="#054a13"
                  strokeWidth={1}
                  strokeOpacity={0.2}
                  fillOpacity={tooltipOpacity}
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
        key={graphData[graphData.length - 1]?.uid}
      />
      <SpVoronoiControls showVoronoi={showVoronoi} setShowVoronoi={setShowVoronoi} />
      <Alert
        cancelButtonText={alertProps.cancelButtonText}
        confirmButtonText={alertProps.confirmButtonText}
        icon="new-link"
        intent={alertProps.intent}
        isOpen={!!alertProps.message}
        onCancel={handleLinkCancel}
        onConfirm={handleLinkConfirm}
      >
        {alertProps.message}
      </Alert>
    </div>
  );
};

export default SpDots;
