import { localPoint } from "@visx/event";
import { scaleLinear } from "@visx/scale";
import { useTooltip } from "@visx/tooltip";
import { voronoi } from "@visx/voronoi";
import React, { useMemo, useState, useCallback, useRef } from "react";
import {
  AlertAttributes,
  DefaulatableAlertAttributes,
  EnhancedPoint,
  PointWithTitleAndId,
} from "../types";
import { Intent } from "@blueprintjs/core";

const NEIGHBOOR_ALERT_ATTRIBUTES: Pick<AlertAttributes, DefaulatableAlertAttributes> = {
  intent: Intent.NONE,
  cancelButtonText: undefined,
  confirmButtonText: "ok",
};

const LINK_ALERT_ATTRIBUTES: Pick<AlertAttributes, DefaulatableAlertAttributes> = {
  intent: Intent.PRIMARY,
  cancelButtonText: "cancel",
  confirmButtonText: "link pages ✨",
};

const DEFAULT_ALERT_ATTRIBUTES: AlertAttributes = {
  ...NEIGHBOOR_ALERT_ATTRIBUTES,
  message: undefined,
};

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

    setAlertProps({
      ...baseAttributes,
      message: alreadyNeighbors ? (
        <>
          [[{tooltipData.title}]] and [[{apexData.title}]] are already neighbors.
        </>
      ) : (
        <>
          create a link between [[<strong>{tooltipData?.title}</strong>]] and [[
          <strong>{apexData?.title}</strong>]]?
        </>
      ),
    });
  }, [tooltipData, apexData]);

  const handleLinkConfirm = useCallback(() => {
    const linkPagesAsync = async () => {
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

      markPageLinked(activeDot.uid);
      setAlertProps({ ...DEFAULT_ALERT_ATTRIBUTES });
    };

    linkPagesAsync();
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
