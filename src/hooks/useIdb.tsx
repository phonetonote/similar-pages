import React from "react";
import resolveRefs from "roamjs-components/dom/resolveRefs";
import { BODY_SIZE } from "../constants";
import { SpDB, DIJKSTRA_STORE, STRINGS_STORE, IDB_NAME, TITLES_STORE } from "../services/idb";
import { getStringAndChildrenString } from "../services/queries";
import { IncomingNode, TITLE_KEY, IncomingNodeMap } from "../types";
import { ShortestPathLengthMapping as ShortestPathMap } from "graphology-shortest-path/unweighted";
import { IDBPDatabase, openDB } from "idb";

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
      const freshDb = await openDB<SpDB>(IDB_NAME, 1, {
        upgrade(db) {
          db.createObjectStore(DIJKSTRA_STORE);
        },
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
            if (txStringStore.count(uid)) {
              operations.push(
                txStringStore.put(
                  resolveRefs(getStringAndChildrenString(attrs).slice(0, BODY_SIZE)),
                  uid
                )
              );
            }
          }
        }
      };

      addApexPageAsync();
    },
    [setApexPageId]
  );

  const addActivePages = React.useCallback((pathMap: ShortestPathMap, nodeMap: IncomingNodeMap) => {
    const addActivePagesAsync = async () => {
      if (!pathMap) {
        return;
      }

      const activePages = Object.entries(pathMap).filter(([uid]) => {
        return uid !== apexPageId;
      });

      setActivePageIds(activePages.map(([uid]) => uid));

      if (!idb.current) {
        console.error("idb not ready");
        return;
      } else {
        const tx = idb.current.transaction(
          [DIJKSTRA_STORE, TITLES_STORE, STRINGS_STORE],
          "readwrite"
        );
        if (tx) {
          const operations = [
            activePages.map(([pageId, dijkstraDiff]) => {
              return tx.objectStore(DIJKSTRA_STORE).put(dijkstraDiff, pageId);
            }),
            activePages.map(([pageId]) => {
              return tx.objectStore(TITLES_STORE).put(nodeMap.get(pageId)[TITLE_KEY], pageId);
            }),
            activePages.map(([pageId]) => {
              if (tx.objectStore(STRINGS_STORE).count(pageId)) {
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
        }
      }
    };

    addActivePagesAsync();
  }, []);

  const pageIdsToEmbed = React.useMemo(() => {
    // TODO reimplement with idb
    return [...activePageIds, apexPageId].filter((p) => !embeddingMap.has(p));
  }, [activePageIds, apexPageId]);

  return [addApexPage, addActivePages, pageIdsToEmbed] as const;
}

export default useIdb;
