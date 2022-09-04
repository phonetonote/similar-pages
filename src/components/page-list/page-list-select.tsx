import * as React from "react";
import { Button, MenuItem, IconName } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { filterPageList, renderPageList } from "./page-lists";
import { SelectablePageList } from "../../types";
import { ACTIVE_QUERIES } from "../sp-body";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";

const PageListSelect = Select.ofType<SelectablePageList>();

function pageListSelect() {
  const selectable_page_lists: SelectablePageList[] = [
    { title: "last 100 updated pages", id: "last-100", icon: "updated" as IconName },
  ].concat(
    ACTIVE_QUERIES.map((query) => {
      const pageTitle = getPageTitleByPageUid(query.uid);
      const nodeTitle = pageTitle.length > 0 ? pageTitle : getTextByBlockUid(query.uid);

      return {
        title: nodeTitle,
        id: query.uid,
        icon: "th-filtered" as IconName,
      };
    })
  );
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
