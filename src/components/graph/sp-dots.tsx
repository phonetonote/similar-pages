import React, { useMemo, useState, useCallback, useRef } from "react";
import { Group } from "@visx/group";
import { Circle } from "@visx/shape";
import { GradientPinkBlue } from "@visx/gradient";
import { scaleLinear } from "@visx/scale";
import { TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { voronoi, VoronoiPolygon } from "@visx/voronoi";
import { localPoint } from "@visx/event";
import { EnhancedPoint, PointWithTitleAndId } from "../../types";
import { Alert, Intent } from "@blueprintjs/core";

const BASE_R = 2;
const CIRCLE_RESIZE_FACTOR = 3;

type DotsProps = {
  width: number;
  height: number;
  showControls?: boolean;
  graphData: EnhancedPoint[];
  apexData: PointWithTitleAndId;
};

let tooltipTimeout: number;

const SpDots = ({ width, height, showControls = true, graphData, apexData }: DotsProps) => {
  const { hideTooltip, showTooltip, tooltipOpen, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<EnhancedPoint>();

  const minMaxXY = useMemo(() => {
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

    return { minXWithPadding, minYWithPadding, maxXWithPadding, maxYWithPadding };
  }, [graphData]);

  const [showVoronoi, setShowVoronoi] = useState(false);
  const [linkAlertIsOpen, setLinkAlertIsOpen] = useState(false);
  const [activeDot, setActiveDot] = useState<EnhancedPoint>();
  const [tooltipMessage, setTooltipMessage] = useState<JSX.Element>(undefined);

  const svgRef = useRef<SVGSVGElement>(null);
  const xScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [minMaxXY.minXWithPadding, minMaxXY.maxXWithPadding],
        range: [0, width],
        clamp: true,
      }),
    [width, minMaxXY.minXWithPadding, minMaxXY.maxXWithPadding]
  );
  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [minMaxXY.minYWithPadding, minMaxXY.maxYWithPadding],
        range: [height, 0],
        clamp: true,
      }),
    [height, minMaxXY.minYWithPadding, minMaxXY.maxYWithPadding]
  );
  const voronoiLayout = useMemo(
    () =>
      voronoi<EnhancedPoint>({
        x: (d) => xScale(d.x) ?? 0,
        y: (d) => yScale(d.y) ?? 0,
        width,
        height,
      })(graphData),
    [width, height, xScale, yScale, graphData]
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
        setActiveDot(closest.data);
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

  const circleClick = useCallback(() => {
    console.log("circleClick tooltipData", tooltipData);

    setTooltipMessage(
      <>
        create a link between [[<strong>{tooltipData?.title}</strong>]] and [[
        <strong>{apexData?.title}</strong>]]?
      </>
    );
    setLinkAlertIsOpen(true);
  }, [tooltipData, apexData]);

  const handleLinkConfirm = useCallback(() => {
    const linkPagesAsync = async () => {
      console.log("handleLinkConfirm activeDot", activeDot);
      console.log("apexData", apexData);

      await window.roamAlphaAPI.createBlock({
        location: { "parent-uid": apexData.uid, order: 0 },
        block: {
          string: `on [[${window.roamAlphaAPI.util.dateToPageTitle(
            new Date()
          )}]] you used [[Similar Pages extension]] to link ${apexData.title} to [[${
            activeDot.title
          }]]`,
        },
      });

      // TODO move dot over to reflect new distance
      // TODO make the dot a different color to indicate it's linked
      // TODO stop moved dot from being linkable (?)

      setLinkAlertIsOpen(false);
    };

    linkPagesAsync();
  }, [activeDot, apexData]);

  const handleLinkCancel = useCallback(() => {
    setLinkAlertIsOpen(false);
  }, []);

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
