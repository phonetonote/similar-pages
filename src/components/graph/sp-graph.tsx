import React from "react";
import { IDBPDatabase, openDB } from "idb";
import {
  DIJKSTRA_STORE,
  TITLE_STORE,
  STRING_STORE,
  SpDB,
  STORES_TYPE,
  IDB_NAME,
  SIMILARITY_STORE,
} from "../../services/idb";

type SpGraphProps = {
  activePageIds: string[];
  apexPageId: string;
};

const SpGraph = ({ activePageIds, apexPageId }: SpGraphProps) => {
  const idb = React.useRef<IDBPDatabase<SpDB>>();
  const [graphData, setGraphData] = React.useState<ScatterPlotRawSerie<ScatterPlotDatum>[]>([]);

  React.useEffect(() => {
    const initializeIdb = async () => {
      const freshDb = await openDB<SpDB>(IDB_NAME, undefined, {
        upgrade(db) {
          const relStores: STORES_TYPE[] = [DIJKSTRA_STORE, TITLE_STORE, STRING_STORE];
          relStores.forEach((store) => {
            if (!db.objectStoreNames.contains(store)) {
              db.createObjectStore(store);
            }
          });
        },
      });

      idb.current = freshDb;

      console.time("get");
      const dijkstraValues = await idb.current.getAll(DIJKSTRA_STORE);
      const titleValues = await idb.current.getAll(TITLE_STORE);
      const similarityValues = await idb.current.getAll(SIMILARITY_STORE);
      const dijkstraKeys = await idb.current.getAllKeys(DIJKSTRA_STORE);
      const titleKeys = await idb.current.getAllKeys(TITLE_STORE);
      const similarityKeys = await idb.current.getAllKeys(SIMILARITY_STORE);
      console.timeEnd("get");

      console.time("map");
      const points = activePageIds.map((pageId) => {
        const dijkstraValue = dijkstraValues[dijkstraKeys.indexOf(pageId)];
        const similarityValue = similarityValues[similarityKeys.indexOf(pageId)];
        const titleValue = titleValues[titleKeys.indexOf(pageId)];

        // TODO set title
        return {
          x: dijkstraValue,
          y: similarityValue,
        };
      });

      const maxX = Math.max(...points.map((point) => point.x));
      const maxY = Math.max(...points.map((point) => point.y));

      const normalizedPoints = points.map((point) => ({
        x: point.x / maxX,
        y: point.y / maxY,
      }));

      const data = [{ id: "points", data: normalizedPoints }];

      console.log(data);
      console.timeEnd("map");

      setGraphData(data);
    };

    initializeIdb();
  }, []);

  console.log("graphData", graphData);

  // TODO hide apex
  return graphData.length > 0 ? (
    <ResponsiveScatterPlotCanvas
      margin={{ top: 60, right: 140, bottom: 70, left: 90 }}
      renderWrapper={true}
      renderNode={(ctx, node) => {
        // ctx.globalCompositeOperation = "overlay";

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size / 2, 0, 2 * Math.PI);
        ctx.fillStyle = "#417668c2";
        // ctx.fillStyle = node.color;
        ctx.fill();
      }}
      data={graphData}
      xScale={{ type: "linear", min: 0, max: 1 }}
      xFormat=">-.2f"
      yScale={{ type: "linear", min: 0, max: 1 }}
      yFormat=">-.2f"
      nodeSize={20}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        orient: "bottom",
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "weight",
        legendPosition: "middle",
        legendOffset: 46,
      }}
      axisLeft={{
        orient: "left",
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "size",
        legendPosition: "middle",
        legendOffset: -60,
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
