import React from "react";
import FilmSelect from "./page-list-select";
import { Button, Card, Elevation } from "@blueprintjs/core";
import PageListSelect from "./page-list-select";

export const PageListCard = () => {
  return (
    <Card elevation={1}>
      <h5 style={{ marginTop: "0" }}>page list</h5>
      <PageListSelect></PageListSelect>
    </Card>
  );
};
