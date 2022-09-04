import React from "react";
import styles from "../styles/grid.module.css";
import * as tf from "@tensorflow/tfjs-core";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import "@tensorflow/tfjs-backend-webgl";
import { getNonDailyPages, getBlocksWithRefs, isUidDailyPage } from "../services/queries";
import { BlockWithRefs, PageAttributes, PageWithEmbedding, Ref } from "../types";
import Graph from "graphology";
import { blockToReferences } from "../services/graph-manip";
import DebugObject from "./debug-object";
import { USE_LOADING_TIME } from "../constants";
import { Spinner, SpinnerSize, ProgressBar, Card } from "@blueprintjs/core";
import { PageListCard } from "./page-list/page-list-card";

// this implies we only want to fetch this once
const nonDailyPages = getNonDailyPages(window.roamAlphaAPI);

export const SpBody = () => {
  const graph = React.useMemo(() => {
    return new Graph();
  }, []);

  const [possiblePages, setPossiblePages] = React.useState<PageWithEmbedding[]>([]);
  const [selectedPage, setSelectedPage] = React.useState<PageWithEmbedding>();
  const [loadingPercentage, setLoadingPercentage] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  // might need selected savedQuery here or simialr

  React.useEffect(() => {
    const loadEmbeddings = async () => {
      console.time("loadEmbeddings");
      tf.setBackend("webgl");

      const blocksWithRefs: BlockWithRefs[] = await getBlocksWithRefs(window.roamAlphaAPI);
      const loadingDenom = USE_LOADING_TIME + nonDailyPages.length + blocksWithRefs.length;
      const model = await use.load();
      setLoadingPercentage(USE_LOADING_TIME / loadingDenom);

      const embeddings = await model.embed(nonDailyPages.map((p) => p.string));
      const embeddingsArr = await embeddings.array();
      setLoadingPercentage((USE_LOADING_TIME + nonDailyPages.length) / loadingDenom);

      nonDailyPages.forEach((p, i) => {
        graph.addNode(p.uid, {
          ...p,
          embedding: embeddingsArr[i],
          i: i,
          active: i <= 100,
        });

        setLoadingPercentage(i / loadingDenom);
      });

      for (const [i, blockWithRefs] of blocksWithRefs.entries()) {
        const blockTargetSources = blockToReferences(blockWithRefs);

        if (blockTargetSources && blockTargetSources.length > 0) {
          for (const blockTargetSource of blockTargetSources) {
            const { target, source } = blockTargetSource;

            if (graph.hasNode(source) && graph.hasNode(target)) {
              if (!graph.hasEdge(source, target)) {
                graph.addEdge(source, target, { weight: 1 });
              } else {
                graph.updateDirectedEdgeAttribute(source, target, "weight", (weight) => weight + 1);
              }
            }
          }
        }

        setLoadingPercentage((i + nonDailyPages.length) / loadingDenom);
      }

      setLoading(false);
      console.timeEnd("loadEmbeddings");
    };

    if (graph && graph.size === 0) {
      loadEmbeddings();
    }
  }, [graph]);

  return (
    <div className={styles.container}>
      <div className={styles.side}>
        {loading ? <ProgressBar value={loadingPercentage}></ProgressBar> : <PageListCard />}
      </div>
      <div className={styles.body}>
        {loading ? (
          <Spinner size={SpinnerSize.LARGE} value={loadingPercentage}></Spinner>
        ) : (
          // <Card elevation={2}>
          <DebugObject obj={graph} />
          // </Card>
        )}
      </div>
    </div>
  );
};
