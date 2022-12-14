import { IconName, Intent } from "@blueprintjs/core";
import { LinearGradient } from "@visx/gradient";
import React from "react";
import { AlertAttributes, DefaulatableAlertAttributes, SP_MODE } from "./types";

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

export const MIN_NEIGHBORS = 1;
export const MIN_DISTANCES = 5;

export const MAX_PAGE_SIZE = 10000;
export const TOO_MANY_PAGES_MESSAGE = `You have more than ${MAX_PAGE_SIZE} pages with references. For performance reasons, only the first ${MAX_PAGE_SIZE} pages will be used for the analysis. [Why ${MAX_PAGE_SIZE}?](https://rxdb.info/slow-indexeddb.html)`;
export const INITIAL_LOADING_INCREMENT = 0.35;

export const NEIGHBOOR_ALERT_ATTRIBUTES: Pick<AlertAttributes, DefaulatableAlertAttributes> = {
  intent: Intent.NONE,
  cancelButtonText: undefined,
  confirmButtonText: "ok",
};

export const LINK_ALERT_ATTRIBUTES: Pick<AlertAttributes, DefaulatableAlertAttributes> = {
  intent: Intent.PRIMARY,
  cancelButtonText: "cancel",
  confirmButtonText: "link pages ✨",
};

export const DEFAULT_ALERT_ATTRIBUTES: AlertAttributes = {
  ...NEIGHBOOR_ALERT_ATTRIBUTES,
  message: undefined,
};

export const PADDING_PERCENTAGE = 0.05;

export const SP_LINEAR_GRADIENT_ID = "sp-dots-custom-gradient";
export const SP_LINEAR_GRADIENT = (
  <LinearGradient
    id={`${SP_LINEAR_GRADIENT_ID}`}
    from="#8EE2FA"
    fromOpacity={0.5}
    to="#54504c"
    toOpacity={0.15}
    rotate="30"
  />
);
