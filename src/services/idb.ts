import { DBSchema } from "idb";

export const IDB_NAME = "sp";
export const DIJKSTRA_STORE = "dijkstraDiffs";
export const STRING_STORE = "fullStrings";
export const EMBEDDING_STORE = "embeddings";
export const SIMILARITY_STORE = "similarities";
export const TITLE_STORE = "titles";

export interface SpDB extends DBSchema {
  [DIJKSTRA_STORE]: {
    key: string;
    value: number;
  };
  [EMBEDDING_STORE]: {
    value: number[];
    key: string;
  };
  [STRING_STORE]: {
    value: string;
    key: string;
  };

  [SIMILARITY_STORE]: {
    value: number;
    key: string;
  };

  [TITLE_STORE]: {
    value: string;
    key: string;
  };
}

export type STORES_TYPE =
  | typeof DIJKSTRA_STORE
  | typeof EMBEDDING_STORE
  | typeof STRING_STORE
  | typeof SIMILARITY_STORE
  | typeof TITLE_STORE;

export const STORES: STORES_TYPE[] = [
  DIJKSTRA_STORE,
  STRING_STORE,
  TITLE_STORE,
  EMBEDDING_STORE,
  SIMILARITY_STORE,
];
