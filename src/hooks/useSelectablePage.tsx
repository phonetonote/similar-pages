import React from "react";
import { NODE_ATTRIBUTES } from "../types";
import { IconName } from "@blueprintjs/core";

const nodeArrToSelectablePage = ([uid, node]: [string, NODE_ATTRIBUTES]) => {
  return {
    title: node.title,
    id: uid,
    icon: "document" as IconName,
  };
};

function useSelectablePage() {
  const [selectablePageNodes, setSelectablePageNodes] = React.useState(
    new Map<string, NODE_ATTRIBUTES>()
  );

  const selectablePages = React.useMemo(() => {
    return Array.from(selectablePageNodes.entries()).map(nodeArrToSelectablePage);
  }, [selectablePageNodes]);

  return [selectablePageNodes, setSelectablePageNodes, selectablePages] as const;
}

export default useSelectablePage;
