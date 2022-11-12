import { localPoint } from "@visx/event";
import { scaleLinear } from "@visx/scale";
import { useTooltip } from "@visx/tooltip";
import { voronoi } from "@visx/voronoi";
import React, { useMemo, useState, useCallback, useRef } from "react";
import {
  DEFAULT_ALERT_ATTRIBUTES,
  NEIGHBOOR_ALERT_ATTRIBUTES,
  LINK_ALERT_ATTRIBUTES,
  PADDING_PERCENTAGE,
} from "../constants";
import { linkPagesAsync } from "../services/graph-manip";
import { tooltipMessageGenerator } from "../services/tooltip-message-generator";
import { AlertAttributes, EnhancedPoint, PointWithTitleAndId } from "../types";

function useCircles(
  graphData: EnhancedPoint[],
  apexData: PointWithTitleAndId,
  width: number,
  height: number,
  markPageLinked: (pageId: string) => void
) {
  const { hideTooltip, showTooltip, tooltipOpen, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<EnhancedPoint>();

  const [alertProps, setAlertProps] = useState<AlertAttributes>({ ...DEFAULT_ALERT_ATTRIBUTES });
  const [activeDot, setActiveDot] = useState<EnhancedPoint>();
  const tooltipTimeout = useRef<number>();

  const minMaxXY = useMemo(() => {
    const xPoints = graphData.map((point) => point.x);
    const yPoints = graphData.map((point) => point.y);
    const minX = Math.min(...xPoints);
    const maxX = Math.max(...xPoints);
    const minY = Math.min(...yPoints);
    const maxY = Math.max(...yPoints);

    const xPadding = (maxX - minX) * PADDING_PERCENTAGE;
    const yPadding = (maxY - minY) * PADDING_PERCENTAGE;

    const minXWithPadding = minX - xPadding;
    const minYWithPadding = minY - yPadding;
    const maxXWithPadding = maxX + xPadding;
    const maxYWithPadding = maxY + yPadding;

    return { minXWithPadding, minYWithPadding, maxXWithPadding, maxYWithPadding };
  }, [graphData]);

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
      if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
      if (!svgRef.current) return;

      const point = localPoint(svgRef.current, event);
      if (!point) return;
      const closest = voronoiLayout.find(point.x, point.y, 100);
      if (closest) {
        setActiveDot(closest.data);
        showTooltip({
          tooltipLeft: xScale(closest.data.x),
          tooltipTop: yScale(closest.data.y),
          tooltipData: closest.data,
        });
      }
    },
    [xScale, yScale, showTooltip, voronoiLayout, tooltipTimeout]
  );

  const handleMouseLeave = useCallback(() => {
    tooltipTimeout.current = window.setTimeout(() => {
      hideTooltip();
    }, 10);
  }, [hideTooltip, tooltipTimeout]);

  const circleClick = useCallback(() => {
    const alreadyNeighbors = tooltipData.rawDistance === 1;
    const baseAttributes = alreadyNeighbors ? NEIGHBOOR_ALERT_ATTRIBUTES : LINK_ALERT_ATTRIBUTES;
    const message = tooltipMessageGenerator(tooltipData.title, apexData.title, alreadyNeighbors);

    setAlertProps({ ...baseAttributes, message });
  }, [tooltipData, apexData]);

  const handleLinkConfirm = useCallback(() => {
    const handleLinkConfirmAsync = async () => {
      await linkPagesAsync(apexData, activeDot.title);
      markPageLinked(activeDot.uid);
      setAlertProps({ ...DEFAULT_ALERT_ATTRIBUTES });
    };

    handleLinkConfirmAsync();
  }, [activeDot, apexData, markPageLinked]);

  const handleLinkCancel = useCallback(() => {
    setAlertProps({ ...DEFAULT_ALERT_ATTRIBUTES });
  }, []);

  return {
    svgRef,
    handleMouseMove,
    handleMouseLeave,
    circleClick,
    activeDot,
    xScale,
    yScale,
    voronoiLayout,
    tooltipData,
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    handleLinkConfirm,
    handleLinkCancel,
    alertProps,
  };
}

export { useCircles };
