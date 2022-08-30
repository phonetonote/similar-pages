import React from "react";
import styles from "../styles/grid.module.css";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import getNonDailyPages from "../services/getNonDailyPages";
import { PageWithEmbedding } from "../types";

const nonDailyPages = getNonDailyPages(window.roamAlphaAPI);

export const SpBody = () => {
  const [embeddedPages, setEmbeddedPages] = React.useState<PageWithEmbedding[]>([]);

  React.useEffect(() => {
    const loadEmbeddings = async () => {
      const model = await use.load();
      const embeddings = await model.embed(nonDailyPages.map((p) => p.string));
      const embeddingsArr = await embeddings.array();

      const nonDailyPagesWithEmbeddngs: PageWithEmbedding[] = nonDailyPages.map((p, i) => ({
        ...p,
        embedding: embeddingsArr[i],
      }));

      setEmbeddedPages(nonDailyPagesWithEmbeddngs);
    };

    loadEmbeddings();
  }, []);
  return (
    <div className={styles.container}>
      <div className={styles.header}>header</div>
      <div className={styles.i3}>
        <div className={styles.side}>side</div>
        <div className={styles.body}>
          {embeddedPages.length == 0 ? <div>loading...</div> : `${embeddedPages.length} pages`}
        </div>
      </div>
      <div className={styles.footer}>footer</div>
    </div>
  );
};
