import * as React from "react";
import { Button, MenuItem } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { filterPageList, renderPageList } from "./selected-pages";
import { PageListSelectProps, SelectablePage, SelectablePageList } from "../../types";

const PageListSelect = Select.ofType<SelectablePageList>();

function pageListSelect(props: PageListSelectProps) {
  const { selectable_pages } = props;
  const [page, setPage] = React.useState(selectable_pages[0]);
  const handleItemSelect = React.useCallback((newPage: SelectablePage) => {
    setPage(newPage);
  }, []);

  return (
    <PageListSelect
      itemPredicate={filterPageList}
      itemRenderer={renderPageList}
      items={selectable_pages}
      filterable={selectable_pages.length > 10}
      itemsEqual="id"
      noResults={<MenuItem disabled={true} text="No results." />}
      onItemSelect={handleItemSelect}
      popoverProps={{ minimal: true }}
    >
      <Button icon={page.icon} rightIcon="caret-down" text={page ? page.title : "(No selection)"} />
    </PageListSelect>
  );
}

export default pageListSelect;
