import { MenuItem, IconName } from "@blueprintjs/core";
import { ItemPredicate, ItemRenderer, SelectProps } from "@blueprintjs/select";
import React from "react";

export type SelectablePageList = {
  title: string;
  id: string;
  icon: IconName;
};

export const selectable_page_lists: SelectablePageList[] = [
  { title: "last 100 updated pages", id: "last-100", icon: "updated" },
  // TODO put vargas page queries here
];

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

function highlightText(text: string, query: string) {
  let lastIndex = 0;
  const words = query
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map(escapeRegExpChars);
  if (words.length === 0) {
    return [text];
  }
  const regexp = new RegExp(words.join("|"), "gi");
  const tokens: React.ReactNode[] = [];
  while (true) {
    const match = regexp.exec(text);
    if (!match) {
      break;
    }
    const length = match[0].length;
    const before = text.slice(lastIndex, regexp.lastIndex - length);
    if (before.length > 0) {
      tokens.push(before);
    }
    lastIndex = regexp.lastIndex;
    tokens.push(<strong key={lastIndex}>{match[0]}</strong>);
  }
  const rest = text.slice(lastIndex);
  if (rest.length > 0) {
    tokens.push(rest);
  }
  return tokens;
}

function escapeRegExpChars(text: string) {
  return text.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
