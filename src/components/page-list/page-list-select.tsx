import * as React from "react";
import { Button, MenuItem, IconName } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { filterPageList, renderPageList } from "./page-lists";
import { PageListSelectProps, SelectablePageList } from "../../types";
import { SELECTABLE_PAGE_LISTS } from "../../constants";

const PageListSelect = Select.ofType<SelectablePageList>();

function pageListSelect(props: PageListSelectProps) {
  const { onPageListSelect } = props;
  const [pageList, setPageList] = React.useState(SELECTABLE_PAGE_LISTS[0]);
  const handleItemSelect = React.useCallback((newPageList: SelectablePageList) => {
    setPageList(newPageList);
    onPageListSelect(newPageList);
  }, []);

  return (
    <PageListSelect
      itemPredicate={filterPageList}
      itemRenderer={renderPageList}
      items={SELECTABLE_PAGE_LISTS}
      filterable={SELECTABLE_PAGE_LISTS.length > 10}
      itemsEqual="id"
      noResults={<MenuItem disabled={true} text="No results." />}
      onItemSelect={handleItemSelect}
      popoverProps={{ minimal: true }}
    >
      <Button
        icon={pageList.icon}
        rightIcon="caret-down"
        text={pageList ? pageList.title : "(No selection)"}
      />
    </PageListSelect>
  );
}

export default React.memo(pageListSelect);
