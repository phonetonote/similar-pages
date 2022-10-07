import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  transform: {
    "^.+\\.[jt]sx?$": "ts-jest",
  },
  transformIgnorePatterns: ["<rootDir>/node_modules/(?!roamjs-components)"],
  testEnvironment: "jsdom",
};

export default config;
