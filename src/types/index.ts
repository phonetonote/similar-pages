import { RoamBlock } from "roamjs-components/types";

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
