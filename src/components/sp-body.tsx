import React from "react";
import gridStyles from "../styles/grid.module.css";
import styles from "../styles/sp-body.module.css";
import {
  FULL_STRING_KEY,
  GraphablePage,
  SelectablePage,
  SHORTEST_PATH_KEY,
  SP_STATUS,
} from "../types";
import DebugObject from "./debug-object";
import { Spinner, Card } from "@blueprintjs/core";
import PageSelect from "./page/page-select";
import { BODY_SIZE, CHUNK_SIZE, MIN_NEIGHBORS } from "../constants";
import { initializeEmbeddingWorker } from "../services/embedding-worker-client";
import useGraph from "../hooks/useGraph";
import useSelectablePage from "../hooks/useSelectablePage";
import { getStringAndChildrenString } from "../services/queries";
import resolveRefs from "roamjs-components/dom/resolveRefs";
import { ShortestPathLengthMapping } from "graphology-shortest-path/unweighted";

export const SpBody = () => {
  // things to refactor here:
  // 1) It's named wrrong. `pageMap`, not `activePageMap`
  // 2) We should use the uid as the key, not the title
  //    This doesn't change the type, but everywhere we set/get
  //    This matters for memory/perf
  // 3) It should be a map of maps, not a map of objects.
  //    This will allow use to reset the active pages more efficiently
  const [pageMap, setPageMap] = React.useState(new Map<string, GraphablePage>());

  const [status, setStatus] = React.useState<SP_STATUS>("CREATING_GRAPH");
  const [selectedPageTitle, setSelectedPageTitle] = React.useState<string>();
  const [graph, initializeGraph, memoizedRoamPages] = useGraph();
  const [selectablePages, selectablePageTitles, setSelectablePageTitles] = useSelectablePage();

  React.useEffect(() => {
    window.setTimeout(() => {
      const initializeGraphAsync = async () => {
        await initializeGraph();
        setSelectablePageTitles(
          graph.filterNodes((node, _) => {
            return (
              graph.hasNodeAttribute(node, SHORTEST_PATH_KEY) &&
              graph.neighbors(node).length >= MIN_NEIGHBORS
            );
          })
        );

        setStatus("GRAPH_INITIALIZED");
        console.timeEnd("createGraph");
      };
      initializeGraphAsync();
    }, 100);
  }, []);

  React.useEffect(() => {
    if (selectedPageTitle) {
      setStatus("GETTING_GRAPH_STATS");
      const apexRoamPage = memoizedRoamPages.get(selectedPageTitle);
      const apexStringAndChildrenString = getStringAndChildrenString(apexRoamPage);
      const apexFullBody = resolveRefs(apexStringAndChildrenString.slice(0, BODY_SIZE));

      console.log("PTNLOG!!! resetting pageMap");

      setPageMap((prev) => {
        const newMap = new Map(prev);

        newMap.forEach((page, key) => {
          newMap.set(key, { ...page, status: "INACTIVE" });
        });

        return newMap;
      });

      console.log("PTNLOG!! setting apex page map");

      setPageMap((prev) =>
        new Map(prev).set(selectedPageTitle, { status: "APEX", [FULL_STRING_KEY]: apexFullBody })
      );

      const singleSourceLengthMap: ShortestPathLengthMapping =
        graph.getNodeAttribute(selectedPageTitle, SHORTEST_PATH_KEY) || {};

      for (const [k, v] of Object.entries(singleSourceLengthMap)) {
        // LATER [[SP-01]]
        const roamPage = memoizedRoamPages.get(k);
        const stringAndChildrenString = getStringAndChildrenString(roamPage);

        setPageMap((prev) => {
          return new Map(prev).set(k, {
            status: "ACTIVE",
            dijkstraDiff: v,
            [FULL_STRING_KEY]:
              prev.get(k)?.[FULL_STRING_KEY] ||
              resolveRefs(stringAndChildrenString.slice(0, BODY_SIZE)),
          });
        });
      }

      setStatus("READY");
    }
  }, [selectedPageTitle, setStatus, setPageMap, graph, memoizedRoamPages]);

  const pageSelectCallback = React.useCallback(
    (page: SelectablePage) => {
      setSelectedPageTitle(page.title);
    },
    [setSelectedPageTitle]
  );

  React.useEffect(() => {
    console.log("PTNLOG!! status", status);

    if (status === "READY") {
      const activePageKeys = Array.from(pageMap)
        .filter((arr) => arr[1].status === "ACTIVE")
        .map((arr) => arr[0]);
      const chunkSize = CHUNK_SIZE;
      for (let i = 0; i < activePageKeys.length; i += chunkSize) {
        const chunkedPageKeys = activePageKeys.slice(i, i + chunkSize);

        // TODO: filter out pages that already have an embedding
        const chunkedPages = chunkedPageKeys.map((k) => pageMap.get(k)); // We should be picking off the relevant keys (FULL_STRING_KEY)

        // we'll need to pass something into the worker to update 🔴 active pages
        initializeEmbeddingWorker(chunkedPages).then((worker) => {
          // don't need to do anything with the worker
        });
      }
    }
  }, [pageMap, status]);

  return status === "CREATING_GRAPH" ? (
    <Spinner></Spinner>
  ) : (
    <div className={gridStyles.container}>
      <div className={gridStyles.side}>
        <Card elevation={1}>
          <h5 className={styles.title}>selected page</h5>
          <PageSelect
            selectablePages={selectablePages}
            onPageSelect={pageSelectCallback}
          ></PageSelect>
        </Card>
      </div>
      <div className={gridStyles.body}>
        <div className={styles.graph}>
          <div className={styles.graphinner}>
            {status === "GETTING_GRAPH_STATS" ? <Spinner></Spinner> : "ready for graph"}
            {/* <SpGraph graph={graph} activePages={activePages}></SpGraph> */}
          </div>
        </div>
        <DebugObject obj={graph.inspect()} />
        <DebugObject obj={selectablePageTitles.length} />
      </div>
    </div>
  );
};
