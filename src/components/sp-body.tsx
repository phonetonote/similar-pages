import React from "react";
import gridStyles from "../styles/grid.module.css";
import styles from "../styles/sp-body.module.css";
import { ActivePage, SelectablePage, SP_STATUS } from "../types";
import DebugObject from "./debug-object";
import { Spinner, Card } from "@blueprintjs/core";
import PageSelect from "./page/page-select";
import { singleSourceLength } from "graphology-shortest-path/unweighted";
import { CHUNK_SIZE } from "../constants";
import { initializeEmbeddingWorker } from "../services/embedding-worker-client";
import useGraph from "../hooks/useGraph";
import useSelectablePage from "../hooks/useSelectablePage";
import useActivePageMap from "../hooks/useActivePageMap";

export const SpBody = () => {
  const [activePageMap, updateActivePageMap] = useActivePageMap();
  const [status, setStatus] = React.useState<SP_STATUS>("CREATING_GRAPH");
  const [selectedPage, setSelectedPage] = React.useState<SelectablePage>();
  const [graph, initializeGraph] = useGraph();
  const [selectablePages, selectablePageTitles, setSelectablePageTitles] = useSelectablePage();

  React.useEffect(() => {
    if (status === "CREATING_GRAPH" && graph && graph.size === 0) {
      window.setTimeout(() => initializeGraph(), 100);
    }

    // 🔖 👀 this looks wrong, status gets set too early
    setStatus("READY_TO_SET_PAGES");
  }, [graph, status]);

  React.useEffect(() => {
    if (status === "READY_TO_SET_PAGES" && selectablePageTitles.length === 0) {
      setSelectablePageTitles(
        graph.filterNodes((node, _) => {
          return graph.edges(node).length > 0;
        })
      );

      setStatus("READY");
      console.timeEnd("createGraph");
    }
  }, [status, selectablePageTitles]);

  const getGraphStats = async (page: SelectablePage) => {
    console.log("getGraphStats top", graph);

    const singleSourceLengthMap = singleSourceLength(graph, page.title);
    updateActivePageMap(page.title, {
      status: "APEX",
      fullBody,
    });

    // const activePages =;
    // 🔖 set 🔵 active pages here
    //    with dijkstra diff
    //    full body if it doesn't exist
    //      resolveRefs(getStringAndChildrenString(node)).slice(0, BODY_SIZE)

    const activePageKeys = Object.keys(activePageMap);
    const chunkSize = CHUNK_SIZE;
    for (let i = 0; i < activePageKeys.length; i += chunkSize) {
      const chhunkedPageKeys = activePageKeys.slice(i, i + chunkSize);

      // TODO: filter out pages that already have an embedding
      const chunkedPages = chhunkedPageKeys.map((k) => activePageMap.get(k)); // We should be picking off the relevant keys (fullBody)

      // we'll need to pass something into the worker to update 🔴 active pages
      initializeEmbeddingWorker(chunkedPages).then((worker) => {
        // don't need to do anything with the worker
      });
    }

    setStatus("READY");

    console.log("getGraphStats end", graph);
  };

  React.useEffect(() => {
    console.log("selectedPage", selectedPage);
    if (selectedPage) {
      setStatus("GETTING_GRAPH_STATS");
      getGraphStats(selectedPage);
    }
  }, [selectedPage]);

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
