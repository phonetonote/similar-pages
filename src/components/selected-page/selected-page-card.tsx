import { Card } from "@blueprintjs/core";
import React from "react";
import { SelectablePage } from "../../types";
import styles from "../../styles/selected-page-card.module.css";
import SelectedPageSelect from "./selected-page-select";

function selectedPageCard(props: { selectable_pages: SelectablePage[] }) {
  const { selectable_pages } = props;
  return (
    <Card elevation={1}>
      <h5 className={styles.title}>selected page</h5>
      <SelectedPageSelect selectable_pages={selectable_pages}></SelectedPageSelect>
    </Card>
  );
}

export default selectedPageCard;
