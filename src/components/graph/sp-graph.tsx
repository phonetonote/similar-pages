import { ResponsiveScatterPlotCanvas } from "@nivo/scatterplot";
import Graph from "graphology";
import { Attributes } from "graphology-types";
import React from "react";
import { SelectablePage } from "../../types";
import { dot } from "mathjs";

type SpGraphProps = {
  graph: Graph<Attributes, Attributes, Attributes>;
  selectedPage: SelectablePage;
};

const SpGraph = ({ graph, selectedPage }: SpGraphProps) => {
  const selectedEmbedding: number[] = selectedPage?.title
    ? graph.getNodeAttributes(selectedPage?.title).embedding
    : undefined;

  // const foo = graph && selectedPage?.id ? adamicAdar(graph, selectedPage?.id) : undefined;
  // console.log("PTNLOG: foo", foo);

  const points = selectedEmbedding
    ? graph
        .filterNodes((n) => graph.getNodeAttribute(n, "active"))
        .map((n) => {
          const embedding = graph.getNodeAttribute(n, "embedding");
          return {
            nodeId: `${n}`,
            x: dot(embedding, selectedEmbedding),
            y: Math.random(),
          };
        })
    : undefined;

  const data = points ? [{ id: "points", data: points }] : undefined;

  // console.log("points", points);

  // console.log("data", data);
  return data ? (
    <ResponsiveScatterPlotCanvas
      renderWrapper={true}
      renderNode={(ctx, node) => {
        // ctx.globalCompositeOperation = "overlay";

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size / 2, 0, 2 * Math.PI);
        ctx.fillStyle = "#417668c2";
        // ctx.fillStyle = node.color;
        ctx.fill();
      }}
      data={data}
      xScale={{ type: "linear", min: -0.1, max: 1.1 }}
      xFormat=">-.2f"
      yScale={{ type: "linear", min: -0.1, max: 1.1 }}
      yFormat=">-.2f"
      nodeSize={20}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 10,
        tickPadding: -40,
        tickRotation: 0,
        legend: "similarity",
        legendPosition: "middle",
        legendOffset: -60,
      }}
      axisLeft={{
        tickSize: 10,
        tickPadding: -40,
        tickRotation: 0,
        legend: "distance",
        legendPosition: "middle",
        legendOffset: 60,
      }}
      legends={[
        {
          anchor: "bottom-right",
          direction: "column",
          justify: false,
          translateX: 130,
          translateY: 0,
          itemWidth: 100,
          itemHeight: 12,
          itemsSpacing: 5,
          itemDirection: "left-to-right",
          symbolSize: 12,
          symbolShape: "circle",
          effects: [
            {
              on: "hover",
              style: {
                itemOpacity: 1,
              },
            },
          ],
        },
      ]}
    />
  ) : (
    <>none</>
  );
};

export default SpGraph;
