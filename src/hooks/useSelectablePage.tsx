import React from "react";
import { SelectablePage } from "../types";
import { IconName } from "@blueprintjs/core";

function useSelectablePage() {
  const [selectablePageTitles, setSelectablePageTitles] = React.useState<string[]>([]);

  const titleToSelectablePage = (title: string, i: number) => ({
    title: title,
    id: `page-${i}`,
    icon: "document" as IconName,
  });

  const selectablePages = React.useMemo(() => {
    return selectablePageTitles.map(titleToSelectablePage);
  }, [selectablePageTitles]);

  return [selectablePages, selectablePageTitles, setSelectablePageTitles] as const;
}

export default useSelectablePage;
