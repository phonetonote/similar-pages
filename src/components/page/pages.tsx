import { MenuItem, IconName } from "@blueprintjs/core";
import { ItemPredicate, ItemRenderer } from "@blueprintjs/select";
import React from "react";
import { highlightText } from "../../services/highlight-text";
import { SelectablePageList } from "../../types";

export const renderPageList: ItemRenderer<SelectablePageList> = (
  pageList,
  { handleClick, modifiers, query }
) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }
  const text = pageList.title;
  return (
    <MenuItem
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={pageList.id}
      onClick={handleClick}
      text={highlightText(text, query)}
    />
  );
};

export const filterPageList: ItemPredicate<SelectablePageList> = (
  query,
  pageList,
  _index,
  exactMatch
) => {
  const normalizedTitle = pageList.title.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (exactMatch) {
    return normalizedTitle === normalizedQuery;
  } else {
    return `${normalizedTitle}`.indexOf(normalizedQuery) >= 0;
  }
};
