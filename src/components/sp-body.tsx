import * as React from "react";
import gridStyles from "../styles/grid.module.css";
import styles from "../styles/sp-body.module.css";
import { SelectablePage, SHORTEST_PATH_KEY, SP_STATUS } from "../types";
import DebugObject from "./debug-object";
import { Spinner, Card, ProgressBar, Elevation } from "@blueprintjs/core";
import PageSelect from "./page/page-select";
import { CHUNK_SIZE, INITIAL_LOADING_INCREMENT } from "../constants";
import { initializeEmbeddingWorker } from "../services/embedding-worker-client";
import useGraph from "../hooks/useGraph";
import { ShortestPathLengthMapping as ShortestPathMap } from "graphology-shortest-path/unweighted";
import useIdb from "../hooks/useIdb";
import { EMBEDDING_STORE, SIMILARITY_STORE } from "../services/idb";
import { dot } from "mathjs";
import SpGraph from "./graph/sp-graph";

export const SpBody = () => {
  const [addApexPage, addActivePages, idb, activePageIds, apexPageId] = useIdb();
  const [status, setStatus] = React.useState<SP_STATUS>("CREATING_GRAPH");
  const [graph, initializeGraph, roamPages, selectablePages] = useGraph();
  const [loadingIncrement, setLoadingIncrement] = React.useState<number>(0);
  const [pagesLeft, setPagesLeft] = React.useState<number>(0);

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

  const pageSelectCallback = React.useCallback(
    ({ id: selectedPageId }: SelectablePage) => {
      if (idb.current && selectedPageId) {
        setLoadingIncrement(INITIAL_LOADING_INCREMENT);
        setStatus("GETTING_GRAPH_STATS");

        const apexRoamPage = roamPages.get(selectedPageId);
        addApexPage(selectedPageId, apexRoamPage);

        const pathMap: ShortestPathMap = graph.getNodeAttribute(selectedPageId, SHORTEST_PATH_KEY);
        addActivePages(pathMap, roamPages);

        setStatus("READY_TO_EMBED");
      }
    },
    [roamPages, graph, addApexPage, addActivePages, idb]
  );

  const checkIfDoneEmbedding = React.useCallback(
    (pagesDone: number) => {
      setLoadingIncrement((prevInc) => prevInc + pagesDone / (activePageIds.length + 1));
      setPagesLeft((prevPagesLeft) => prevPagesLeft - pagesDone);
    },
    [activePageIds]
  );

  React.useEffect(() => {
    if (idb.current && pagesLeft === 0) {
      const setSimilaritiesAsync = async () => {
        const tx = idb.current.transaction([EMBEDDING_STORE, SIMILARITY_STORE], "readwrite");
        const embeddingsStore = tx.objectStore(EMBEDDING_STORE);
        const similaritiesStore = tx.objectStore(SIMILARITY_STORE);
        const apexEmbedding = await embeddingsStore.get(apexPageId);

        if (apexEmbedding) {
          const operations: Promise<any>[] = [similaritiesStore.clear()];

          for await (const { value: embedding, key } of embeddingsStore) {
            if (activePageIds.includes(key)) {
              operations.push(similaritiesStore.put(dot(apexEmbedding, embedding), key));
            }
          }

          await Promise.all(operations);
          await tx.done;

          setStatus("READY_TO_DISPLAY");
        }
      };

      setSimilaritiesAsync();
    }
  }, [pagesLeft, idb, activePageIds, apexPageId]);

  React.useEffect(() => {
    if (status === "READY_TO_EMBED") {
      const initializeEmbeddingsAsync = async () => {
        setLoadingIncrement(INITIAL_LOADING_INCREMENT);

        const embeddingsKeys = await idb.current?.getAllKeys(EMBEDDING_STORE);
        const idsToEmbed = [...activePageIds, apexPageId].filter((p) => {
          return !embeddingsKeys.includes(p);
        });

        if (idsToEmbed.length > 0) {
          setPagesLeft(idsToEmbed.length);

          for (let i = 0; i < idsToEmbed.length; i += CHUNK_SIZE) {
            const chunkedPageIds = idsToEmbed.slice(i, i + CHUNK_SIZE);
            await initializeEmbeddingWorker(chunkedPageIds, checkIfDoneEmbedding);
          }
        } else {
          setPagesLeft(0);
        }
      };

      initializeEmbeddingsAsync();
    }
  }, [status, checkIfDoneEmbedding, activePageIds, apexPageId, idb]);

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
              <SpGraph activePageIds={activePageIds} apexPageId={apexPageId}></SpGraph>
            ) : (
              <>
                <Card elevation={Elevation.ONE}>
                  <ProgressBar value={loadingIncrement}></ProgressBar>
                  <p>
                    this takes a few moments for pages in the middle of a large graph, but we cache
                    the computations so subsequent pages will be faster 🏄‍♂️
                  </p>
                </Card>
              </>
            )}
          </div>
        </div>
        <DebugObject obj={graph.inspect()} />
      </div>
    </div>
  );
};
