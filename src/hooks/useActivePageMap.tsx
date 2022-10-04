import React from "react";
import { ActivePage } from "../types";

function useActivePageMap() {
  const [activePageMap, setActivePageMap] = React.useState(new Map<string, ActivePage>());
  const updateActivePageMap = (title: string, activePage: ActivePage) => {
    setActivePageMap(new Map(activePageMap).set(title, activePage));
  };

  return [activePageMap, updateActivePageMap] as const;
}

export default useActivePageMap;
