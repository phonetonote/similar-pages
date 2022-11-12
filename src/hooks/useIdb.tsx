import resolveRefs from "roamjs-components/dom/resolveRefs";
import { BODY_SIZE } from "../constants";
import {
  DIJKSTRA_STORE,
  STRING_STORE,
  IDB_NAME,
  TITLE_STORE,
  STORES,
  STORES_TYPE,
} from "../services/idb";
import { getFullString } from "../services/queries";
import { IncomingNode, TITLE_KEY, IncomingNodeMap } from "../types";
import { ShortestPathLengthMapping as ShortestPathMap } from "graphology-shortest-path/unweighted";
import { IDBPDatabase, openDB } from "idb/with-async-ittr";
import * as React from "react";

function useIdb() {
  const [activePageIds, setActivePageIds] = React.useState<string[]>([]);
  const [apexPageId, setApexPageId] = React.useState<string>();
  const idb = React.useRef<IDBPDatabase<any>>();

  React.useEffect(() => {
    const initializeIdb = async () => {
      const freshDb = await openDB(IDB_NAME, undefined, {
        upgrade(db: IDBPDatabase) {
          STORES.forEach((store: STORES_TYPE) => {
            if (!db.objectStoreNames.contains(store)) {
              db.createObjectStore(store);
            }
          });
        },
      });

      const clearTx = freshDb.transaction(STORES, "readwrite");
      const clearOperations = STORES.map((store) => clearTx.objectStore(store).clear());
      await Promise.all(clearOperations);
      await clearTx.done;

      idb.current = freshDb;
    };

    initializeIdb();
  }, []);

  const addApexPage = React.useCallback(
    (uid: string, attrs: IncomingNode) => {
      const addApexPageAsync = async () => {
        setApexPageId(uid);

        const tx = idb.current.transaction([TITLE_STORE, STRING_STORE], "readwrite");
        const operations = [tx.objectStore(TITLE_STORE).put(attrs[TITLE_KEY], uid)];
        const txStringStore = tx.objectStore(STRING_STORE);
        const currentStringCount = await txStringStore.count(uid);

        if (currentStringCount === 0) {
          const pageString = resolveRefs(getFullString(attrs).slice(0, BODY_SIZE));
          operations.push(txStringStore.put(pageString, uid));
        }

        await Promise.all(operations);
        await tx.done;
      };

      addApexPageAsync();
    },
    [setApexPageId, idb]
  );

  const addActivePages = React.useCallback(
    (pathMap: ShortestPathMap, nodeMap: IncomingNodeMap) => {
      const addActivePagesAsync = async () => {
        const localActivePages = Object.entries(pathMap).filter(([uid]) => {
          return uid !== apexPageId;
        });

        setActivePageIds(localActivePages.map(([uid]) => uid));

        const tx = idb.current.transaction(
          [DIJKSTRA_STORE, TITLE_STORE, STRING_STORE],
          "readwrite"
        );
        const existingStringKeys = await tx.objectStore(STRING_STORE).getAllKeys();
        const operations = [
          tx.objectStore(DIJKSTRA_STORE).clear(),
          ...localActivePages.map(([pageId, dijkstraDiff]) => {
            return tx.objectStore(DIJKSTRA_STORE).put(dijkstraDiff, pageId);
          }),
          ...localActivePages.map(([pageId]) => {
            return tx.objectStore(TITLE_STORE).put(nodeMap.get(pageId)[TITLE_KEY], pageId);
          }),
          ...localActivePages.map(([pageId]) => {
            if (existingStringKeys.includes(pageId)) {
              return null;
            }

            const pageString = resolveRefs(getFullString(nodeMap.get(pageId)).slice(0, BODY_SIZE));
            return tx.objectStore(STRING_STORE).put(pageString, pageId);
          }),
        ].filter((maybeOperation) => !!maybeOperation);

        await Promise.all(operations);
        await tx.done;
      };

      addActivePagesAsync();
    },
    [apexPageId]
  );

  return [addApexPage, addActivePages, idb, activePageIds, apexPageId] as const;
}

export default useIdb;
