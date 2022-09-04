import * as React from "react";

import { Button, MenuItem } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";

import {
  filterPageList,
  renderPageList,
  SelectablePageList,
  selectable_page_lists,
} from "./page-lists";

const PageListSelect = Select.ofType<SelectablePageList>();

function pageListSelect() {
  const [pageList, setPageList] = React.useState(selectable_page_lists[0]);
  const handleItemSelect = React.useCallback((newPageList: SelectablePageList) => {
    setPageList(newPageList);
  }, []);

  return (
    <PageListSelect
      itemPredicate={filterPageList}
      itemRenderer={renderPageList}
      items={selectable_page_lists}
      filterable={selectable_page_lists.length > 10}
      itemsEqual="id"
      noResults={<MenuItem disabled={true} text="No results." />}
      onItemSelect={handleItemSelect}
      popoverProps={{ minimal: true }}
      matchTargetWidth={true}
    >
      <Button
        icon={pageList.icon}
        rightIcon="caret-down"
        text={pageList ? pageList.title : "(No selection)"}
      />
    </PageListSelect>
  );
}

export default pageListSelect;
