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
