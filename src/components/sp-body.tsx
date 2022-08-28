import React from "react";
import styles from "../styles/grid.module.css";
import * as use from "@tensorflow-models/universal-sentence-encoder";

declare global {
  interface Window {
    use: any;
  }
}

export const SpBody = () => {
  React.useEffect(() => {
    use.load().then((model) => {
      // Embed an array of sentences.
      const sentences = ["Hello.", "How are you?"];
      model.embed(sentences).then((embeddings) => {
        // `embeddings` is a 2D tensor consisting of the 512-dimensional embeddings for each sentence.
        // So in this example `embeddings` has the shape [2, 512].
        embeddings.print(true /* verbose */);
      });
    });
  }, []);
  return (
    <div className={styles.container}>
      <div className={styles.header}>header</div>
      <div className={styles.i3}>
        <div className={styles.side}>side</div>
        <div className={styles.body}>body</div>
      </div>
      <div className={styles.footer}>footer</div>
    </div>
  );
};
