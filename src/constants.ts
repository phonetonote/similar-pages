import { IconName } from "@blueprintjs/core";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import { SelectablePageList, SP_MODE } from "./types";

export const ROOT_ID = "ptn-similar-pages";
export const USE_LOADING_TIME = 1000;
export const LAST_100_PAGES = {
  title: "last 100 updated pages",
  id: "last-100",
  icon: "updated" as IconName,
};
export const ACTIVE_QUERIES = window.roamjs.extension.queryBuilder.listActiveQueries();
export const SELECTABLE_PAGE_LISTS: SelectablePageList[] = [LAST_100_PAGES].concat(
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

export const BODY_SIZE = 500;

export const DEFAULT_MODE: SP_MODE = "neighbors";
