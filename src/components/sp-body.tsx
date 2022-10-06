import React from "react";
import gridStyles from "../styles/grid.module.css";
import styles from "../styles/sp-body.module.css";
import {
  ActivePage,
  FULL_STRING_KEY,
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
  const [activePageMap, setActivePageMap] = React.useState(new Map<string, ActivePage>());

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
      const apexFullBody = resolveRefs(
        getStringAndChildrenString(apexRoamPage).slice(0, BODY_SIZE)
      );

      console.log("PTNLOG!! setting apex page map");
      setActivePageMap((prev) =>
        new Map(prev).set(selectedPageTitle, { status: "APEX", [FULL_STRING_KEY]: apexFullBody })
      );

      // TODO clear previous active pages
      const singleSourceLengthMap: ShortestPathLengthMapping =
        graph.getNodeAttribute(selectedPageTitle, SHORTEST_PATH_KEY) || {};

      for (const [k, v] of Object.entries(singleSourceLengthMap)) {
        // LATER [[SP-01]]
        const roamPage = memoizedRoamPages.get(k);
        const stringAndChildrenString = getStringAndChildrenString(roamPage);

        setActivePageMap((prev) => {
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
  }, [selectedPageTitle, setStatus, setActivePageMap, graph, memoizedRoamPages]);

  const pageSelectCallback = React.useCallback(
    (page: SelectablePage) => {
      setSelectedPageTitle(page.title);
    },
    [setSelectedPageTitle]
  );

  React.useEffect(() => {
    console.log("PTNLOG!! status", status);
    console.log("PTNLOG!! activePageMap.size", activePageMap.size);

    if (status === "READY") {
      const activePageKeys = Array.from(activePageMap.keys());
      const chunkSize = CHUNK_SIZE;
      for (let i = 0; i < activePageKeys.length; i += chunkSize) {
        const chunkedPageKeys = activePageKeys.slice(i, i + chunkSize);

        // TODO: filter out pages that already have an embedding
        const chunkedPages = chunkedPageKeys.map((k) => activePageMap.get(k)); // We should be picking off the relevant keys (FULL_STRING_KEY)

        // we'll need to pass something into the worker to update 🔴 active pages
        initializeEmbeddingWorker(chunkedPages).then((worker) => {
          // don't need to do anything with the worker
        });
      }
    }
  }, [activePageMap, status]);

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
