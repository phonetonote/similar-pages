import React from "react";
import styles from "../styles/grid.module.css";
import * as tf from "@tensorflow/tfjs-core";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import "@tensorflow/tfjs-backend-webgl";
import getNonDailyPages from "../services/getNonDailyPages";
import { PageWithEmbedding } from "../types";
import Graph from "graphology";

// this implies we only want to fetch this once
const nonDailyPages = getNonDailyPages(window.roamAlphaAPI);

export const SpBody = () => {
  const graph = React.useMemo(() => {
    return new Graph();
  }, []);

  const [possiblePages, setPossiblePages] = React.useState<PageWithEmbedding[]>([]);
  const [selectedPage, setSelectedPage] = React.useState<PageWithEmbedding>();
  const [loading, setLoading] = React.useState(true);
  // might need selected savedQuery here or simialr

  React.useEffect(() => {
    const loadEmbeddings = async () => {
      console.time("loadEmbeddings");
      tf.setBackend("webgl");
      const model = await use.load();
      const embeddings = await model.embed(nonDailyPages.map((p) => p.string));
      const embeddingsArr = await embeddings.array();
      nonDailyPages.forEach((p, i) => {
        graph.addNode(p.title, {
          ...p,
          embedding: embeddingsArr[i],
          id: i,
        });
      });
      setLoading(false);
      console.timeEnd("loadEmbeddings");
    };

    if (graph && graph.size === 0) {
      loadEmbeddings();
    }
  }, [graph]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>header</div>
      <div className={styles.i3}>
        <div className={styles.side}>side</div>
        <div className={styles.body}>
          {loading ? <div>loading...</div> : `${graph.nodes().length} pages`}
        </div>
      </div>
      <div className={styles.footer}>footer</div>
    </div>
  );
};
