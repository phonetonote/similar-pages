import React from "react";
import gridStyles from "../styles/grid.module.css";
import styles from "../styles/sp-body.module.css";
import { ActivePage, SelectablePage, SP_STATUS } from "../types";
import DebugObject from "./debug-object";
import { Spinner, Card } from "@blueprintjs/core";
import PageSelect from "./page/page-select";
// import { singleSourceLength } from "graphology-shortest-path/unweighted";
import { singleSourceLength } from "graphology-shortest-path";
import dijkstra from "graphology-shortest-path/dijkstra";

import { BODY_SIZE, CHUNK_SIZE } from "../constants";
import { initializeEmbeddingWorker } from "../services/embedding-worker-client";
import useGraph from "../hooks/useGraph";
import useSelectablePage from "../hooks/useSelectablePage";
import { getStringAndChildrenString } from "../services/queries";
import resolveRefs from "roamjs-components/dom/resolveRefs";

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
            return graph.edges(node).length > 0;
          })
        );

        setStatus("READY");
        console.timeEnd("createGraph");
      };
      initializeGraphAsync();
    }, 100);
  }, []);

  React.useEffect(() => {
    if (selectedPageTitle) {
      const apexRoamPage = memoizedRoamPages.get(selectedPageTitle);
      const apexFullBody = resolveRefs(
        getStringAndChildrenString(apexRoamPage).slice(0, BODY_SIZE)
      );
      setActivePageMap((prev) =>
        new Map(prev).set(selectedPageTitle, { status: "APEX", fullBody: apexFullBody })
      );

      // TODO clear previous active pages
      // const singleSourceLengthMap = singleSourceLength(graph, selectedPageTitle);
      // console.log("singleSourceLengthMap", singleSourceLengthMap);
      // for (const [k, v] of Object.entries(singleSourceLengthMap)) {
      //   const roamPage = memoizedRoamPages.get(k);
      //   const newFullBody =
      //     activePageMap.get(k)?.fullBody ||
      //     resolveRefs(getStringAndChildrenString(roamPage).slice(0, BODY_SIZE));

      //   setActivePageMap((prev) => {
      //     return new Map(prev).set(k, {
      //       status: "ACTIVE",
      //       dijkstraDiff: v,
      //       fullBody: newFullBody,
      //     });
      //   });
      // }

      // const activePageKeys = Object.keys(activePageMap);
      // const chunkSize = CHUNK_SIZE;
      // for (let i = 0; i < activePageKeys.length; i += chunkSize) {
      //   const chunkedPageKeys = activePageKeys.slice(i, i + chunkSize);

      //   // TODO: filter out pages that already have an embedding
      //   const chunkedPages = chunkedPageKeys.map((k) => activePageMap.get(k)); // We should be picking off the relevant keys (fullBody)

      //   // we'll need to pass something into the worker to update 🔴 active pages
      //   initializeEmbeddingWorker(chunkedPages).then((worker) => {
      //     // don't need to do anything with the worker
      //   });
      // }

      setStatus("READY");
    }
  }, [selectedPageTitle]);

  const pageSelectCallback = React.useCallback(
    (page: SelectablePage) => {
      setSelectedPageTitle(page.title);
    },
    [activePageMap, setActivePageMap]
  );

  React.useEffect(() => {
    console.log("useEffect activePageMap", activePageMap);
  }, [activePageMap]);

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
