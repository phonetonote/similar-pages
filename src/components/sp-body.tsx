import React from "react";
import gridStyles from "../styles/grid.module.css";
import styles from "../styles/sp-body.module.css";
import {
  EmbeddablePageOutput,
  NODE_ATTRIBUTES,
  SelectablePage,
  SHORTEST_PATH_KEY,
  SP_STATUS,
  TIME_KEY,
  TITLE_KEY,
  UID_KEY,
} from "../types";
import DebugObject from "./debug-object";
import { Spinner, Card, ProgressBar } from "@blueprintjs/core";
import PageSelect from "./page/page-select";
import { CHUNK_SIZE, MIN_NEIGHBORS } from "../constants";
import { initializeEmbeddingWorker } from "../services/embedding-worker-client";
import useGraph from "../hooks/useGraph";
import useSelectablePage from "../hooks/useSelectablePage";
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
    apexPageId,
    fullStringMap,
    dijkstraDiffMap,
    similarityMap,
    titleMap,
  ] = usePageMap();
  const [status, setStatus] = React.useState<SP_STATUS>("CREATING_GRAPH");
  const [selectedPage, setSelectedPage] = React.useState<NODE_ATTRIBUTES>();
  const [graph, initializeGraph, roamPages] = useGraph();
  const [selectablePageNodes, setSelectablePageNodes, selectablePages] = useSelectablePage();
  const [loadingIncrement, setLoadingIncrement] = React.useState<number>(0);

  React.useEffect(() => {
    if (graph.size === 0) {
      window.setTimeout(() => {
        const initializeGraphAsync = async () => {
          await initializeGraph();
          const newPageNodes = new Map<string, NODE_ATTRIBUTES>();

          graph
            .filterNodes((node) => {
              const hasPaths: boolean = graph.hasNodeAttribute(node, SHORTEST_PATH_KEY);
              const hasNeighbors = graph.neighbors(node).length >= MIN_NEIGHBORS;

              return hasPaths && hasNeighbors;
            })
            .forEach((node) => {
              const { [TITLE_KEY]: title, [UID_KEY]: uid, [TIME_KEY]: time } = roamPages.get(node);
              newPageNodes.set(node, { title, uid, time });
            });

          setSelectablePageNodes(newPageNodes);
          setStatus("GRAPH_INITIALIZED");

          console.timeEnd("createGraph");
        };
        initializeGraphAsync();
      }, 10);
    }
  }, [graph, initializeGraph, roamPages, setSelectablePageNodes]);

  React.useEffect(() => {
    if (selectedPage) {
      const apexRoamPage = roamPages.get(selectedPage.uid);
      const singleSourceLengthMap: ShortestPathLengthMapping =
        graph.getNodeAttribute(selectedPage.uid, SHORTEST_PATH_KEY) || {};
      setStatus("GETTING_GRAPH_STATS");
      clearActivePages();
      upsertApexAttrs(selectedPage.uid, apexRoamPage);
      for (const [uid, dijkstraDiff] of Object.entries(singleSourceLengthMap)) {
        if (uid !== apexRoamPage[UID_KEY]) {
          upsertActiveAttrs(uid, roamPages.get(uid), dijkstraDiff);
        }
      }
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

  const addEmbeddingsToActivePageMap = React.useCallback(
    (embeddablePageOutputs: EmbeddablePageOutput[]) => {
      setStatus("SYNCING_EMBEDS");
      setLoadingIncrement((prev) => prev + (1 - prev) / 2);
      addEmbeddings(embeddablePageOutputs);
    },
    []
  );

  React.useEffect(() => {
    if (status === "SYNCING_EMBEDS" && embeddingMap.size === pageKeysToEmbed.length) {
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
    apexPageId,
    status,
    addSimilarities,
    addEmbeddings,
    pageKeysToEmbed,
    fullStringMap,
    dijkstraDiffMap,
    similarityMap,
    titleMap,
    embeddingMap,
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
        <DebugObject obj={selectablePageNodes.size} />
      </div>
    </div>
  );
};
