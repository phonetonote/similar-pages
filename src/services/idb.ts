import { DBSchema } from "idb";

export const IDB_NAME = "sp";
export const IDB_STORES = {
  pages: "pages",
};

export const DIJKSTRA_STORE = "dijkstraDiffs";
export const STRINGS_STORE = "fullStrings";
export const EMBEDDINGS_STORE = "embeddings";
export const SIMILARITIES_STORE = "similarities";
export const TITLES_STORE = "titles";

export interface SpDB extends DBSchema {
  [DIJKSTRA_STORE]: {
    key: string;
    value: number;
  };
  [EMBEDDINGS_STORE]: {
    value: number[];
    key: string;
  };
  [STRINGS_STORE]: {
    value: string;
    key: string;
  };

  [SIMILARITIES_STORE]: {
    value: number;
    key: string;
  };

  [TITLES_STORE]: {
    value: string;
    key: string;
  };
}
