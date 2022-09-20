import * as React from "react";
import { Button, MenuItem } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { filterPageList, renderPageList } from "./pages";
import { PageSelectProps, SelectablePage } from "../../types";

const PageSelect = Select.ofType<SelectablePage>();

function pageSelect(props: PageSelectProps) {
  const { selectablePages, onPageSelect } = props;
  const defaultPage = selectablePages ? selectablePages[0] : undefined;
  const [page, setPage] = React.useState(defaultPage);
  const handleItemSelect = React.useCallback((newPage: SelectablePage) => {
    setPage(newPage);
    onPageSelect(newPage);
  }, []);

  React.useEffect(() => {
    setPage(selectablePages[0]);
    onPageSelect(selectablePages[0]);
  }, [selectablePages]);

  return page ? (
    <PageSelect
      className="page-select"
      itemPredicate={filterPageList}
      itemRenderer={renderPageList}
      items={selectablePages}
      filterable={selectablePages.length > 10}
      itemsEqual="id"
      noResults={<MenuItem disabled={true} text="No results." />}
      onItemSelect={handleItemSelect}
      popoverProps={{ minimal: true }}
    >
      <Button icon={page.icon} rightIcon="caret-down" text={page ? page.title : "(No selection)"} />
    </PageSelect>
  ) : (
    <span>no non-journal pages found</span>
  );
}

export default pageSelect;
