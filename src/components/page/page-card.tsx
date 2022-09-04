import { Card } from "@blueprintjs/core";
import React from "react";
import { PageCardProps } from "../../types";
import styles from "../../styles/selected-page-card.module.css";
import SelectedPageSelect from "./page-select";

function pageCard(props: PageCardProps) {
  const { selectablePages, onPageSelect } = props;

  return (
    <Card elevation={1}>
      <h5 className={styles.title}>selected page</h5>
      <SelectedPageSelect
        selectablePages={selectablePages}
        onPageSelect={onPageSelect}
      ></SelectedPageSelect>
    </Card>
  );
}

export default pageCard;
