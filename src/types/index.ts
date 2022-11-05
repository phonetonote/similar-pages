export const PAGE_KEYS = ["string", "time", "title", "uid"] as const;

export type Page = {
  [key in typeof PAGE_KEYS[number]]: string;
};

export type FastPage = {
  time: number;
  title: string;
  uid: string;
};

export type PageWithEmbedding = Page & {
  embedding: number[];
};

export type Film = {
  title: string;
  year: number;
  rank?: number;
};

export type Films = Film[];

export type Ref = {
  id: number;
};

export type PageAttributes = {
  embedding: number[];
  i: number;
  string: string;
  time: string;
  title: string;
  uid: string;
  active: boolean;
};

export type PageSelectProps = {
  selectablePages: SelectablePageList[];
  onPageSelect: (page: SelectablePage) => void;
};

export type PageCardProps = PageSelectProps;

export type SelectablePageList = {
  title: string;
  id: string;
  icon: String;
};

export type SelectablePage = {
  title: string;
  id: string;
  icon: String;
};

export type PageListSelectProps = {
  onPageListSelect: (newPageList: SelectablePageList) => void;
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
  | "SYNCING_EMBEDS"
  | "READY_TO_DISPLAY";

export type SP_MODE = "neighbors" | "queries";

export type ResultWithTitle = {
  text: string;
  uid: string;
  ":block/uid": string;
  ":node/title": string;
};

export type NODE_ATTRIBUTES = {
  title: string;
  time: number;
  uid: string;
};

export type NeighborData = {
  neighbors: string[];
  outerNeighbors: string[];
};
export type NEIGHBOR_MAP = Map<string, NeighborData>;

// GP is Graphable Page

export type GPStatus = "APEX" | "ACTIVE" | "INACTIVE";

export type EmbeddingWorker = { current: Worker | undefined; init: boolean };

export type PointsRange = [number, number, number];
export type Point = {
  x: number;
  y: number;
};
