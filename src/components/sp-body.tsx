import React from "react";
import styles from "../styles/grid.module.css";

export const SpBody = () => {
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
