import React from "react";
import gridStyles from "../styles/grid.module.css";
import styles from "../styles/sp-body.module.css";
import * as tf from "@tensorflow/tfjs-core";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import "@tensorflow/tfjs-backend-webgl";
import { getNonDailyPages, getBlocksWithRefs, isUidDailyPage } from "../services/queries";
import { BlockWithRefs, PageAttributes, PageWithEmbedding, Ref, SelectablePage } from "../types";
import Graph from "graphology";
import { blockToReferences } from "../services/graph-manip";
import DebugObject from "./debug-object";
import { USE_LOADING_TIME } from "../constants";
import { Spinner, SpinnerSize, ProgressBar, Card } from "@blueprintjs/core";
import PageListSelect from "./page-list/page-list-select";
import SelectedPageCard from "./selected-page/selected-page-card";

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

  const selectable_pages: SelectablePage[] = graph
    .filterNodes((n) => graph.getNodeAttribute(n, "active"))
    .map((n) => ({
      title: graph.getNodeAttribute(n, "title"),
      id: graph.getNodeAttribute(n, "uid"),
      icon: "document",
    }));

  return (
    <div className={gridStyles.container}>
      <div className={gridStyles.side}>
        {loading ? (
          <ProgressBar value={loadingPercentage}></ProgressBar>
        ) : (
          [
            <SelectedPageCard selectable_pages={selectable_pages}></SelectedPageCard>,
            <Card elevation={1}>
              <h5 className={styles.title}>page list</h5>
              <PageListSelect></PageListSelect>
            </Card>,
          ]
        )}
      </div>
      <div className={gridStyles.body}>
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
