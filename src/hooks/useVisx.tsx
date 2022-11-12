import { IDBPDatabase, openDB } from "idb";
import React from "react";
import {
  SpDB,
  IDB_NAME,
  STORES_TYPE,
  DIJKSTRA_STORE,
  TITLE_STORE,
  STRING_STORE,
  SIMILARITY_STORE,
} from "../services/idb";
import { EnhancedPoint, PointWithTitleAndId } from "../types";

const TOP_CUTOFF = 20;

function useVisx(apexPageId: string, activePageIds: string[]) {
  const idb = React.useRef<IDBPDatabase<SpDB>>();
  const [graphData, setGraphData] = React.useState<EnhancedPoint[]>([]);
  const [apexData, setApexData] = React.useState<PointWithTitleAndId>();

  const markPageLinked = React.useCallback((pageId: string) => {
    const markPageLinkedAsync = async () => {
      setGraphData((prev) => {
        const newX = Math.min(...prev.map((point) => point.x));

        const newGraphData = [...prev];
        const index = newGraphData.findIndex((point) => point.uid === pageId);
        const elementToMove = { ...newGraphData[index], linked: true, x: newX, rawDistance: 1 };

        newGraphData.splice(index, 1);
        newGraphData.push(elementToMove);
        return newGraphData;
      });
    };

    markPageLinkedAsync();
  }, []);

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
        (acc: { active: PointWithTitleAndId[]; apex: PointWithTitleAndId }, pageId) => {
          const dijkstraValue = dijkstraValues[dijkstraKeys.indexOf(pageId)];
          const similarityValue = similarityValues[similarityKeys.indexOf(pageId)];
          const title = titleValues[titleKeys.indexOf(pageId)];

          if (dijkstraValue && similarityValue && pageId !== apexPageId) {
            acc.active.push({
              x: dijkstraValue,
              y: similarityValue,
              title,
              uid: pageId,
              linked: false,
            });
          } else if (pageId === apexPageId) {
            acc.apex = { x: dijkstraValue, y: similarityValue, title, uid: pageId, linked: false };
          }

          return acc;
        },
        { active: [], apex: null }
      );

      const maxX = Math.max(...activeAndApexpoints.active.map(({ x }) => x));

      const normalizedPoints = activeAndApexpoints.active.map(({ x, y, title, ...rest }) => {
        const scaledX = x / maxX;
        return { ...rest, x: scaledX, y, title, rawDistance: x, score: scaledX * y };
      });

      const topIndex = normalizedPoints.length / TOP_CUTOFF;
      const enhancedNormalizedPoints = normalizedPoints
        .sort((a, b) => b.score - a.score)
        .map((point, i) => {
          return { ...point, isTop: i < topIndex };
        });

      setGraphData(enhancedNormalizedPoints);
      setApexData({ ...activeAndApexpoints.apex, uid: apexPageId });
    };

    initializeIdb();
  }, [activePageIds, apexPageId]);

  return { graphData, apexData, markPageLinked };
}

export { useVisx };
