import React from "react";
import gridStyles from "../styles/grid.module.css";
import styles from "../styles/sp-body.module.css";
import { getPagesAndBlocksWithRefs } from "../services/queries";
import { ActivePage, PPAGE_KEY, REF_KEY, SelectablePage, SP_STATUS, TITLE_KEY } from "../types";
import DebugObject from "./debug-object";
import { Spinner, Card } from "@blueprintjs/core";
import PageSelect from "./page/page-select";
import { singleSourceLength } from "graphology-shortest-path/unweighted";

import { CHUNK_SIZE } from "../constants";
import { initializeEmbeddingWorker } from "../services/embedding-worker-client";
import useGraph from "../hooks/useGraph";
import useSelectablePage from "../hooks/useSelectablePage";

export const SpBody = () => {
  const [activePages, setActivePages] = React.useState<any[]>([]);
  const [status, setStatus] = React.useState<SP_STATUS>("CREATING_GRAPH");
  const [selectedPage, setSelectedPage] = React.useState<SelectablePage>();
  const [graph, addEdgeToGraph, addNodeToGraph] = useGraph();
  const [selectablePages, selectablePageTitles, setSelectablePageTitles] = useSelectablePage();

  React.useEffect(() => {
    if (status === "CREATING_GRAPH" && graph && graph.size === 0) {
      // helps perceived perf by allowing spinner to load faster
      window.setTimeout(() => createGraph(), 100);
    }

    const createGraph = async () => {
      console.time("createGraph");

      const { pages, blocksWithRefs } = getPagesAndBlocksWithRefs();

      pages.forEach(addNodeToGraph);

      for (let i = 0; i < blocksWithRefs.length; i += 1) {
        const sourceBlock = blocksWithRefs[i][0];
        const sourceBlockPageTitle = sourceBlock?.[PPAGE_KEY]?.[TITLE_KEY];

        if (sourceBlockPageTitle) {
          const sourceRefs = sourceBlock?.[REF_KEY] ?? [];

          for (let j = 0; j < sourceRefs.length; j += 1) {
            const targetRef = sourceRefs[j];
            if (targetRef[TITLE_KEY]) {
              addEdgeToGraph(sourceBlockPageTitle, targetRef[TITLE_KEY]);
            } else if (targetRef[PPAGE_KEY]) {
              addEdgeToGraph(sourceBlockPageTitle, targetRef[PPAGE_KEY][TITLE_KEY]);
            }
          }
        }
      }

      // LATER add paths-with-refs once I understand what they are
      // https://github.com/trashhalo/logseq-graph-analysis/commit/90250ad1785a7c46be0b5240383aca653f540859
      // https://discuss.logseq.com/t/what-are-path-refs/10413

      console.log("graph", graph);

      setStatus("READY_TO_SET_PAGES");
      console.timeEnd("createGraph");
    };
  }, [graph, status]);

  React.useEffect(() => {
    if (status === "READY_TO_SET_PAGES" && selectablePageTitles.length === 0) {
      setSelectablePageTitles(
        graph.filterNodes((node, _) => {
          return graph.edges(node).length > 0;
        })
      );

      setStatus("READY");
    }
  }, [status, selectablePageTitles]);

  const getGraphStats = async (page: SelectablePage) => {
    console.log("getGraphStats top", graph);

    const singleSourceLengthMap = singleSourceLength(graph, page.title);
    const activePages = new Map<string, ActivePage>();
    // 🔖 set 🔵 active pages here
    //    with dijkstra diff
    //    full body if it doesn't exist
    //      resolveRefs(getStringAndChildrenString(node)).slice(0, BODY_SIZE)

    const activePageKeys = Object.keys(activePages);
    const chunkSize = CHUNK_SIZE;
    for (let i = 0; i < activePageKeys.length; i += chunkSize) {
      const chhunkedPageKeys = activePageKeys.slice(i, i + chunkSize);
      const chunkedPages = chhunkedPageKeys.map((k) => activePages.get(k));

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
