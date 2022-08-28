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
