import { RoamBlock } from "roamjs-components/types";
import { IconName } from "@blueprintjs/core";

export type RoamExtentionAPI = {
  settings: {
    get: (key: string) => string | undefined;
    set: (key: string, value: string) => void;
    getAll: () => { [key: string]: string };
    panel: {
      create: (config: any) => void;
    };
  };
};

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

export type TargetSource = {
  target: string;
  source: string;
};

export type Film = {
  title: string;
  year: number;
  rank?: number;
};

export type Films = Film[];

export type RichRef = {
  id: number;
  time: number;
  title: string;
  uid: string;
  user: { id: number };
  source: string;
  target: string;
};

export type Ref = {
  id: number;
};

export type BlockWithRefs = RoamBlock & {
  refs?: RichRef[];
  parents?: Ref[];
  page?: Ref;
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
  icon: IconName;
};

export type SelectablePage = {
  title: string;
  id: string;
  icon: IconName;
};

export type PageListSelectProps = {
  onPageListSelect: (newPageList: SelectablePageList) => void;
};

export const TITLE_KEY = ":node/title";
export const FULL_STRING_KEY = "fullString";
export const EMBEDDING_KEY = "embedding";
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
  [TITLE_KEY]: string;
  [PPAGE_KEY]?: PPage;
  [REF_KEY]?: IncomingNode[];
  [TIME_KEY]: number;
};

export type PPage = {
  [UID_KEY]: string;
  [TITLE_KEY]: string;
  [TIME_KEY]: number;
};

export type PRef = {
  [UID_KEY]: string;
  [REF_KEY]: IncomingNode[];
  [PPAGE_KEY]: PPage;
};

export type SP_STATUS = "CREATING_GRAPH" | "GRAPH_INITIALIZED" | "GETTING_GRAPH_STATS" | "READY";

export type SP_MODE = "neighbors" | "queries";

export type ResultWithTitle = {
  text: string;
  uid: string;
  ":block/uid": string;
  ":node/title": string;
};

// given (node, attributes) where
// node is Title (string), these are the attributes:
// this means title is repeated as the node itself and in the attributes
// #TODO we should have uid as the node and title as an attribute
// but the redundancy is fine for now
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

export type RoamData = Map<string, IncomingNode>;

export type GraphablePage = {
  status: "APEX" | "ACTIVE" | "INACTIVE";
  dijkstraDiff?: number;
  [FULL_STRING_KEY]?: string;
  embedding?: number[];
  similarity?: number;
};
