import { Intent } from "@blueprintjs/core";

export const PAGE_KEYS = ["string", "time", "title", "uid"] as const;

export type Page = {
  [key in typeof PAGE_KEYS[number]]: string;
};

export type FastPage = {
  time: number;
  title: string;
  uid: string;
};

export type PageSelectProps = {
  selectablePages: SelectablePageList[];
  onPageSelect: (page: SelectablePage) => void;
};

export type SelectablePageList = {
  title: string;
  id: string;
  icon: string;
};

export type SelectablePage = {
  title: string;
  id: string;
  icon: string;
};

export const TITLE_KEY = ":node/title";
export const UID_KEY = ":block/uid";
export const CHILDREN_KEY = ":block/children";
export const STRING_KEY = ":block/string";
export const TIME_KEY = ":edit/time";
export const PPAGE_KEY = ":block/page";
export const REF_KEY = ":block/refs";
export const SHORTEST_PATH_KEY = "shortestPathMap";

export type Children = {
  [STRING_KEY]: string;
  [CHILDREN_KEY]?: Children[];
  [UID_KEY]: string;
  [TITLE_KEY]?: string;
};

export type IncomingNode = {
  [STRING_KEY]?: string;
  [CHILDREN_KEY]?: Children[];
  [UID_KEY]: string;
  [TITLE_KEY]?: string;
  [PPAGE_KEY]?: PPage;
  [REF_KEY]?: IncomingNode[];
  [TIME_KEY]: number;
};

export type IncomingNodeMap = Map<string, IncomingNode>;

export type PPage = {
  [UID_KEY]: string;
  [TITLE_KEY]?: string;
  [TIME_KEY]: number;
};

export type PRef = {
  [UID_KEY]: string;
  [REF_KEY]: IncomingNode[];
  [PPAGE_KEY]: PPage;
};

export type SP_STATUS =
  | "CREATING_GRAPH"
  | "GRAPH_INITIALIZED"
  | "GETTING_GRAPH_STATS"
  | "READY_TO_EMBED"
  | "READY_TO_DISPLAY";

export type SP_MODE = "neighbors" | "queries";

export type NODE_ATTRIBUTES = {
  title: string;
  time: number;
  uid: string;
};

// GP is Graphable Page

export type EmbeddingWorker = { current: Worker | undefined; init: boolean };

export type Point = {
  x: number;
  y: number;
};

export type PointWithTitle = Point & {
  title: string;
};

export type PointWithTitleAndId = PointWithTitle & {
  uid: string;
  linked: boolean;
};

export type EnhancedPoint = PointWithTitleAndId & {
  isTop: boolean;
  rawDistance: number;
  score: number;
  linked: boolean;
};

export type AlertAttributes = {
  message: JSX.Element;
  intent: Intent;
  confirmButtonText: string;
  cancelButtonText: string;
};

export type DefaulatableAlertAttributes = "intent" | "cancelButtonText" | "confirmButtonText";
