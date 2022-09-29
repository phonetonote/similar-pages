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

export const BODY_SIZE = 250;
export const CHUNK_SIZE = 100;

export const DEFAULT_MODE: SP_MODE = "neighbors";

// arbitrary but performance considerations are real,
// and a graph with few nodes is less interesting
// anyway
export const MIN_NEIGHBORS = 3;
