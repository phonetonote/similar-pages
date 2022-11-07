import React from "react";
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import SpDots from "./sp-dots";
import { useVisx } from "../../hooks/useVisx";

type SpGraphProps = {
  activePageIds: string[];
  apexPageId: string;
};

const SpGraph = ({ activePageIds, apexPageId }: SpGraphProps) => {
  const { graphData, apexData, markPageLinked } = useVisx(apexPageId, activePageIds);

  console.log("markPageLinked", markPageLinked);
  // 🔖 markPageLinked is a callback that marks a page as linked

  return graphData.length > 0 ? (
    <ParentSize>
      {({ width, height }) => (
        <SpDots width={width} height={height} graphData={graphData} apexData={apexData} />
      )}
    </ParentSize>
  ) : (
    <>no data to graph</>
  );
};

export default SpGraph;
