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
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import SpDots from "./sp-dots";
import { Point, EnhancedPoint, PointWithTitle } from "../../types";

const TOP_CUTOFF = 20;

type SpGraphProps = {
  activePageIds: string[];
  apexPageId: string;
};

const SpGraph = ({ activePageIds, apexPageId }: SpGraphProps) => {
  const idb = React.useRef<IDBPDatabase<SpDB>>();
  const [graphData, setGraphData] = React.useState<EnhancedPoint[]>([]);
  const [apexData, setApexData] = React.useState<PointWithTitle>();

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

      const dijkstraValues = await idb.current.getAll(DIJKSTRA_STORE);
      const titleValues = await idb.current.getAll(TITLE_STORE);
      const similarityValues = await idb.current.getAll(SIMILARITY_STORE);
      const dijkstraKeys = await idb.current.getAllKeys(DIJKSTRA_STORE);
      const titleKeys = await idb.current.getAllKeys(TITLE_STORE);
      const similarityKeys = await idb.current.getAllKeys(SIMILARITY_STORE);

      const activeAndApexpoints = activePageIds.reduce(
        (acc: { active: PointWithTitle[]; apex: PointWithTitle }, pageId) => {
          const dijkstraValue = dijkstraValues[dijkstraKeys.indexOf(pageId)];
          const similarityValue = similarityValues[similarityKeys.indexOf(pageId)];
          const title = titleValues[titleKeys.indexOf(pageId)];

          if (dijkstraValue && similarityValue && pageId !== apexPageId) {
            acc.active.push({ x: dijkstraValue, y: similarityValue, title });
          } else if (pageId === apexPageId) {
            console.log("setting apex data", { x: dijkstraValue, y: similarityValue, title });
            acc.apex = { x: dijkstraValue, y: similarityValue, title };
          }

          return acc;
        },
        { active: [], apex: null }
      );

      const maxX = Math.max(...activeAndApexpoints.active.map(({ x }) => x));

      const normalizedPoints = activeAndApexpoints.active.map(({ x, y, title }) => {
        const scaledX = x / maxX;
        return { x: scaledX, y, title, rawDistance: x, score: scaledX * y };
      });

      const topIndex = normalizedPoints.length / TOP_CUTOFF;
      const enhancedNormalizedPoints = normalizedPoints
        .sort((a, b) => b.score - a.score)
        .map((point, i) => {
          return { ...point, isTop: i < topIndex };
        });

      setGraphData(enhancedNormalizedPoints);
      setApexData(activeAndApexpoints.apex);
    };

    initializeIdb();
  }, []);

  // visx implementation

  console.log("apexData spgraph", apexData);

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
