import resolveRefs from "roamjs-components/dom/resolveRefs";
import { BODY_SIZE } from "../constants";
import {
  SpDB,
  DIJKSTRA_STORE,
  STRINGS_STORE,
  IDB_NAME,
  TITLES_STORE,
  Store,
  INITIAL_STORES,
} from "../services/idb";
import { getStringAndChildrenString } from "../services/queries";
import { IncomingNode, TITLE_KEY, IncomingNodeMap } from "../types";
import { ShortestPathLengthMapping as ShortestPathMap } from "graphology-shortest-path/unweighted";
import { deleteDB, IDBPDatabase, openDB } from "idb";
import * as React from "react";

function useIdb() {
  const [activePageIds, setActivePageIds] = React.useState<string[]>([]);
  const [apexPageId, setApexPageId] = React.useState<string>();
  const idb = React.useRef<IDBPDatabase<SpDB>>();

  React.useEffect(() => {
    let active = true;
    load();
    return () => {
      active = false;
    };

    async function load() {
      const freshDb = await openDB<SpDB>(IDB_NAME, undefined, {
        upgrade(db) {
          INITIAL_STORES.forEach((store: Store) => {
            if (!db.objectStoreNames.contains(store)) {
              db.createObjectStore(store);
            }
          });
        },
      });

      INITIAL_STORES.forEach((store: Store) => {
        freshDb.clear(store);
      });

      if (!active) {
        return;
      }

      idb.current = freshDb;
    }
  }, []);

  const addApexPage = React.useCallback(
    (uid: string, attrs: IncomingNode) => {
      const addApexPageAsync = async () => {
        setApexPageId(uid);

        if (!idb.current) {
          console.error("idb not initialized");
          return;
        } else {
          const tx = idb.current.transaction([TITLES_STORE, STRINGS_STORE], "readwrite");

          if (tx) {
            const operations = [tx.objectStore(TITLES_STORE).put(attrs[TITLE_KEY], uid)];

            const txStringStore = tx.objectStore(STRINGS_STORE);
            if ((await txStringStore.count(uid)) === 0) {
              operations.push(
                txStringStore.put(
                  resolveRefs(getStringAndChildrenString(attrs).slice(0, BODY_SIZE)),
                  uid
                )
              );
            }

            await Promise.all(operations);
            tx.done;
          }
        }
      };

      addApexPageAsync();
    },
    [setApexPageId, idb]
  );

  const addActivePages = React.useCallback(
    (pathMap: ShortestPathMap, nodeMap: IncomingNodeMap) => {
      const addActivePagesAsync = async () => {
        if (!pathMap) {
          return;
        }

        const localActivePages = Object.entries(pathMap).filter(([uid]) => {
          return uid !== apexPageId;
        });

        setActivePageIds(localActivePages.map(([uid]) => uid));

        if (!idb.current) {
          console.error("idb not ready");
          return;
        } else {
          const tx = idb.current.transaction(
            [DIJKSTRA_STORE, TITLES_STORE, STRINGS_STORE],
            "readwrite"
          );
          if (tx) {
            const existingStringKeys = await tx.objectStore(STRINGS_STORE).getAllKeys();

            const operations = [
              localActivePages.map(([pageId, dijkstraDiff]) => {
                return tx.objectStore(DIJKSTRA_STORE).put(dijkstraDiff, pageId);
              }),
              localActivePages.map(([pageId]) => {
                return tx.objectStore(TITLES_STORE).put(nodeMap.get(pageId)[TITLE_KEY], pageId);
              }),
              localActivePages.map(([pageId]) => {
                if (existingStringKeys.includes(pageId)) {
                  return null;
                } else {
                  return tx
                    .objectStore(STRINGS_STORE)
                    .put(
                      resolveRefs(
                        getStringAndChildrenString(nodeMap.get(pageId)).slice(0, BODY_SIZE)
                      ),
                      pageId
                    );
                }
              }),
              tx.done,
            ].filter((maybeOperation) => !!maybeOperation);

            await Promise.all(operations);
            tx.done;
          }
        }
      };

      addActivePagesAsync();
    },
    [apexPageId]
  );

  return [addApexPage, addActivePages, idb, activePageIds, apexPageId] as const;
}

export default useIdb;
