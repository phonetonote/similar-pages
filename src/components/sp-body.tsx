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
import useActivePageMap from "../hooks/useActivePageMap";
import { getStringAndChildrenString } from "../services/queries";
import resolveRefs from "roamjs-components/dom/resolveRefs";

export const SpBody = () => {
  const [activePageMap, updateActivePageMap] = useActivePageMap();
  const [status, setStatus] = React.useState<SP_STATUS>("CREATING_GRAPH");
  const [selectedPage, setSelectedPage] = React.useState<SelectablePage>();
  const [graph, initializeGraph, memoizedRoamPages] = useGraph();
  const [selectablePages, selectablePageTitles, setSelectablePageTitles] = useSelectablePage();

  React.useEffect(() => {
    const initializeGraphDeferred = () => {
      return new Promise((resolve) => window.setTimeout(() => initializeGraph(), 100));
    };

    const initializeGraphAsync = async () => {
      await initializeGraphDeferred();
    };

    initializeGraphAsync();
  }, []);

  // const getGraphStats = async (page: SelectablePage) => {
  //   console.log("getGraphStats top graph", graph);
  //   console.log("getGraphStats top activePageMap", activePageMap);

  //   const apexRoamPage = memoizedRoamPages.get(page.title);
  //   const apexFullBody = resolveRefs(getStringAndChildrenString(apexRoamPage).slice(0, BODY_SIZE));
  //   updateActivePageMap(page.title, {
  //     status: "APEX",
  //     fullBody: apexFullBody,
  //   });

  //   const singleSourceLengthMap = singleSourceLength(graph, page.title);
  //   for (const [k, v] of Object.entries(singleSourceLengthMap)) {
  //     const roamPage = memoizedRoamPages.get(k);
  //     const newFullBody =
  //       activePageMap.get(k)?.fullBody ||
  //       resolveRefs(getStringAndChildrenString(roamPage).slice(0, BODY_SIZE));
  //     updateActivePageMap(k, {
  //       status: "ACTIVE",
  //       dijkstraDiff: v,
  //       fullBody: newFullBody,
  //     });
  //   }

  //   const activePageKeys = Object.keys(activePageMap);
  //   const chunkSize = CHUNK_SIZE;
  //   for (let i = 0; i < activePageKeys.length; i += chunkSize) {
  //     const chhunkedPageKeys = activePageKeys.slice(i, i + chunkSize);

  //     // TODO: filter out pages that already have an embedding
  //     const chunkedPages = chhunkedPageKeys.map((k) => activePageMap.get(k)); // We should be picking off the relevant keys (fullBody)

  //     // we'll need to pass something into the worker to update 🔴 active pages
  //     initializeEmbeddingWorker(chunkedPages).then((worker) => {
  //       // don't need to do anything with the worker
  //     });
  //   }

  //   setStatus("READY");

  //   console.log("getGraphStats end graph", graph);
  //   console.log("getGraphStats end activePageMap", activePageMap);
  // };

  // React.useEffect(() => {
  //   console.log("selectedPage", selectedPage);
  //   if (selectedPage && status === "READY_TO_SET_PAGES") {
  //     console.error("one");
  //     setStatus("GETTING_GRAPH_STATS");
  //     // getGraphStats(selectedPage);
  //   }
  // }, [selectedPage, status, setStatus, activePageMap, updateActivePageMap]);
  // adding getGraphStats to the dependency array causes an infinite loop
  // fix:
  // 1. don't add it to the dependency array
  // 2. add a check to see if the selectedPage has changed
  // 3. add a check to see if the selectedPage is truthy
  // 4. add a check to see if the status is READY_TO_SET_PAGES
  // 5. add a check to see if the graph is truthy
  // 6. add a check to see if the graph size is 0
  // 7. add a check to see if the selectablePageTitles length is 0
  // 8. add a check to see if the status is READY
  // 9. add a check to see if the status is GETTING_GRAPH_STATS
  // 10. add a check to see if the status is READY
  // TLDR: this is a mess

  return status === "CREATING_GRAPH" ? (
    <Spinner></Spinner>
  ) : (
    <div className={gridStyles.container}>
      <div className={gridStyles.side}>
        <Card elevation={1}>
          <h5 className={styles.title}>selected page</h5>
          <PageSelect
            selectablePages={selectablePages}
            onPageSelect={(page: SelectablePage) => setSelectedPage(page)}
          ></PageSelect>
        </Card>
      </div>
      <div className={gridStyles.body}>
        <div className={styles.graph}>
          <div className={styles.graphinner}>
            {status === "GETTING_GRAPH_STATS" ? <Spinner></Spinner> : "ready for graph"}
            {/* <SpGraph graph={graph} selectedPage={selectedPage}></SpGraph> */}
          </div>
        </div>
        <DebugObject obj={graph.inspect()} />
        <DebugObject obj={selectedPage} />
        <DebugObject obj={selectablePageTitles.length} />
      </div>
    </div>
  );
};
