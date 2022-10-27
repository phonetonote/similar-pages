import * as React from "react";
import { Button, MenuItem } from "@blueprintjs/core";
import { filterPageList, renderPageList } from "./pages";
import { PageSelectProps, SelectablePage } from "../../types";
import { Select } from "@blueprintjs/select";

const PageSelect = Select.ofType<SelectablePage>();

function PageSelectComponent(props: PageSelectProps) {
  const { selectablePages, onPageSelect } = props;
  const [page, setPage] = React.useState(undefined);
  const handleItemSelect = React.useCallback(
    (newPage: SelectablePage) => {
      setPage(newPage);
      onPageSelect(newPage);
    },
    [onPageSelect]
  );

  return (
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
      inputProps={{ placeholder: "Select a page" }}
    >
      <Button icon={page?.icon} rightIcon="caret-down" text={page ? page.title : "select a page"} />
    </PageSelect>
  );
}

export default PageSelectComponent;
