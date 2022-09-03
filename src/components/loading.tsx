import React from "react";
import { ProgressBar, Spinner } from "@blueprintjs/core";

type LoadingProps = {
  value: number;
};

function loading(props: LoadingProps) {
  console.log("loading", props.value);
  // return <ProgressBar value={props.value}></ProgressBar>;
  return <Spinner value={props.value}></Spinner>;
}

export default loading;
