import React from "react";
import gridStyles from "../styles/grid.module.css";
import styles from "../styles/sp-body.module.css";
import { ActivePage, SelectablePage, SP_STATUS } from "../types";
import DebugObject from "./debug-object";
import { Spinner, Card } from "@blueprintjs/core";
import PageSelect from "./page/page-select";
import { singleSourceLength } from "graphology-shortest-path/unweighted";
import { BODY_SIZE, CHUNK_SIZE } from "../constants";
import { initializeEmbeddingWorker } from "../services/embedding-worker-client";
import useGraph from "../hooks/useGraph";
import useSelectablePage from "../hooks/useSelectablePage";
import { getStringAndChildrenString } from "../services/queries";
import resolveRefs from "roamjs-components/dom/resolveRefs";

export const SpBody = () => {
  const [activePageMap, setActivePageMap] = React.useState(new Map<string, ActivePage>());

  const [status, setStatus] = React.useState<SP_STATUS>("CREATING_GRAPH");
  const [graph, initializeGraph, memoizedRoamPages] = useGraph();
  const [selectablePages, selectablePageTitles, setSelectablePageTitles] = useSelectablePage();

  React.useEffect(() => {
    window.setTimeout(() => {
      const initializeGraphAsync = async () => {
        await initializeGraph();
        setSelectablePageTitles(
          graph.filterNodes((node, _) => {
            return graph.edges(node).length > 0;
          })
        );

        setStatus("READY");
        console.timeEnd("createGraph");
      };
      initializeGraphAsync();
    }, 100);
  }, []);

  const getGraphStats = async (page: SelectablePage) => {
    console.log("getGraphStats top activePageMap", activePageMap);

    const apexRoamPage = memoizedRoamPages.get(page.title);
    const apexFullBody = resolveRefs(getStringAndChildrenString(apexRoamPage).slice(0, BODY_SIZE));
    setActivePageMap((prev) =>
      new Map(prev).set(page.title, { status: "APEX", fullBody: apexFullBody })
    );
    console.log("getGraphStats end activePageMap", activePageMap);

    setStatus("READY");

    // const singleSourceLengthMap = singleSourceLength(graph, page.title);
    // for (const [k, v] of Object.entries(singleSourceLengthMap)) {
    //   const roamPage = memoizedRoamPages.get(k);
    //   const newFullBody =
    //     activePageMap.get(k)?.fullBody ||
    //     resolveRefs(getStringAndChildrenString(roamPage).slice(0, BODY_SIZE));
    //   updateActivePageMap(k, {
    //     status: "ACTIVE",
    //     dijkstraDiff: v,
    //     fullBody: newFullBody,
    //   });
    // }

    // const activePageKeys = Object.keys(activePageMap);
    // const chunkSize = CHUNK_SIZE;
    // for (let i = 0; i < activePageKeys.length; i += chunkSize) {
    //   const chhunkedPageKeys = activePageKeys.slice(i, i + chunkSize);

    //   // TODO: filter out pages that already have an embedding
    //   const chunkedPages = chhunkedPageKeys.map((k) => activePageMap.get(k)); // We should be picking off the relevant keys (fullBody)

    //   // we'll need to pass something into the worker to update 🔴 active pages
    //   initializeEmbeddingWorker(chunkedPages).then((worker) => {
    //     // don't need to do anything with the worker
    //   });
    // }
  };

  const pageSelectCallback = React.useCallback(
    (page: SelectablePage) => {
      getGraphStats(page);
    },
    [getGraphStats, activePageMap, setActivePageMap]
  );

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
