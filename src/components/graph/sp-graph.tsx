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
import { Point, PointsRange } from "../../types";

type SpGraphProps = {
  activePageIds: string[];
  apexPageId: string;
};

const SpGraph = ({ activePageIds, apexPageId }: SpGraphProps) => {
  const idb = React.useRef<IDBPDatabase<SpDB>>();
  const [graphData, setGraphData] = React.useState<Point[]>([]);

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

      const points = activePageIds.reduce((acc: Point[], pageId) => {
        if (pageId !== apexPageId) {
          const dijkstraValue = dijkstraValues[dijkstraKeys.indexOf(pageId)];
          const similarityValue = similarityValues[similarityKeys.indexOf(pageId)];
          const titleValue = titleValues[titleKeys.indexOf(pageId)];

          // TODO set title

          if (dijkstraValue && similarityValue) {
            acc.push({ x: dijkstraValue, y: similarityValue });
          }
        }

        return acc;
      }, []);

      const maxX = Math.max(...points.map((point) => point.x));
      const maxY = Math.max(...points.map((point) => point.y));

      const normalizedPoints = points.map((point) => {
        return { x: point.x / maxX, y: point.y };
      });

      setGraphData(normalizedPoints);
    };

    initializeIdb();
  }, []);

  // visx implementation

  return graphData.length > 0 ? (
    <ParentSize>
      {({ width, height }) => <SpDots width={width} height={height} graphData={graphData} />}
    </ParentSize>
  ) : (
    <>no data to graph</>
  );
};

export default SpGraph;
