import React from "react";
import gridStyles from "../styles/grid.module.css";
import styles from "../styles/sp-body.module.css";
import {
  EmbeddablePageOutput,
  NODE_ATTRIBUTES,
  SelectablePage,
  SHORTEST_PATH_KEY,
  SP_STATUS,
} from "../types";
import DebugObject from "./debug-object";
import { Spinner, Card, ProgressBar } from "@blueprintjs/core";
import PageSelect from "./page/page-select";
import { CHUNK_SIZE } from "../constants";
import { initializeEmbeddingWorker } from "../services/embedding-worker-client";
import useGraph from "../hooks/useGraph";
import { ShortestPathLengthMapping } from "graphology-shortest-path/unweighted";
import usePageMap from "../hooks/usePageMap";

export const SpBody = () => {
  const [
    clearActivePages,
    upsertApexAttrs,
    upsertActiveAttrs,
    addEmbeddings,
    addSimilarities,
    pageKeysToEmbed,
    embeddingMap,
    fullStringMap,
    dijkstraDiffMap,
    similarityMap,
    titleMap,
    hasAllEmbeddings,
  ] = usePageMap();
  const [status, setStatus] = React.useState<SP_STATUS>("CREATING_GRAPH");
  const [selectedPage, setSelectedPage] = React.useState<NODE_ATTRIBUTES>();
  const [graph, initializeGraph, roamPages, selectablePages] = useGraph();
  const [loadingIncrement, setLoadingIncrement] = React.useState<number>(0);

  React.useEffect(() => {
    if (graph.size === 0) {
      window.setTimeout(() => {
        const initializeGraphAsync = async () => {
          await initializeGraph();
          setStatus("GRAPH_INITIALIZED");
        };
        initializeGraphAsync();
      }, 10);
    }
  }, [graph, initializeGraph]);

  React.useEffect(() => {
    if (selectedPage) {
      setStatus("GETTING_GRAPH_STATS");

      const apexRoamPage = roamPages.get(selectedPage.uid);
      const singleSourceLengthMap: ShortestPathLengthMapping =
        graph.getNodeAttribute(selectedPage.uid, SHORTEST_PATH_KEY) || {};

      clearActivePages();
      upsertApexAttrs(selectedPage.uid, apexRoamPage);
      upsertActiveAttrs(singleSourceLengthMap, roamPages);
      setStatus("READY_TO_EMBED");
    }
  }, [
    selectedPage,
    setStatus,
    clearActivePages,
    upsertApexAttrs,
    upsertActiveAttrs,
    graph,
    roamPages,
  ]);

  const pageSelectCallback = React.useCallback(
    ({ id, title }: SelectablePage) => {
      setSelectedPage({ uid: id, title: title, time: undefined });
    },
    [setSelectedPage]
  );

  // probably need to calculate the distance in the worker and not return the embeddings, too much data
  const addEmbeddingsToActivePageMap = React.useCallback(
    (embeddablePageOutputs: EmbeddablePageOutput[]) => {
      console.log("embeddablePageOutputs", embeddablePageOutputs[0]["id"]);
      console.time("addEmbeddings");
      setStatus("SYNCING_EMBEDS");
      setLoadingIncrement((prev) => prev + (1 - prev) / 2); // 🔖 comment out the other lines here
      addEmbeddings(embeddablePageOutputs);
      console.timeEnd("addEmbeddings");
      console.log("--------------------------\n");
    },
    [addEmbeddings]
  );

  React.useEffect(() => {
    // 🔖 TODO hasAllEmbeddings seems a bit slow
    if (status === "SYNCING_EMBEDS" && hasAllEmbeddings) {
      addSimilarities(embeddingMap);
      setStatus("READY_TO_DISPLAY");
    } else if (status === "READY_TO_EMBED") {
      const initializeEmbeddingsAsync = async () => {
        setLoadingIncrement(0.35);

        if (pageKeysToEmbed.length > 0) {
          for (let i = 0; i < pageKeysToEmbed.length; i += CHUNK_SIZE) {
            const chunkedPagesWithIds = pageKeysToEmbed.slice(i, i + CHUNK_SIZE).map((id) => {
              return { id, fullString: fullStringMap.get(id) };
            });

            await initializeEmbeddingWorker(chunkedPagesWithIds, addEmbeddingsToActivePageMap);
          }
        } else {
          setStatus("SYNCING_EMBEDS");
        }
      };

      initializeEmbeddingsAsync();
    }
  }, [
    status,
    addSimilarities,
    addEmbeddings,
    pageKeysToEmbed,
    fullStringMap,
    dijkstraDiffMap,
    similarityMap,
    titleMap,
    embeddingMap,
    hasAllEmbeddings,
    addEmbeddingsToActivePageMap,
  ]);

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
            {status === "GRAPH_INITIALIZED" ? (
              "Select a page to get started"
            ) : status === "READY_TO_DISPLAY" ? (
              "Time to graph"
            ) : (
              <>
                <Spinner></Spinner>
                <ProgressBar value={loadingIncrement}></ProgressBar>
              </>
            )}
            {/* <SpGraph graph={graph} activePages={activePages}></SpGraph> */}
          </div>
        </div>
        <DebugObject obj={graph.inspect()} />
      </div>
    </div>
  );
};
