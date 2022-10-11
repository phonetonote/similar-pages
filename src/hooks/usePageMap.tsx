import React from "react";
import resolveRefs from "roamjs-components/dom/resolveRefs";
import { BODY_SIZE } from "../constants";
import { activeOrApex, getStringAndChildrenString } from "../services/queries";
import { FULL_STRING_KEY, GraphablePage, IncomingNode, PAGE_TITLE_KEY, TITLE_KEY } from "../types";

function usePageMap() {
  const [pageMap, setPageMap] = React.useState(new Map<string, GraphablePage>());

  const clearActivePages = React.useCallback(() => {
    setPageMap((prev) => {
      const newMap = new Map(prev);

      newMap.forEach((page, key) => {
        newMap.set(key, { ...page, status: "INACTIVE" });
      });

      return newMap;
    });
  }, [setPageMap]);

  const upsertApexAttrs = React.useCallback(
    (uid: string, attrs: IncomingNode) => {
      setPageMap((prev) => {
        return new Map(prev).set(uid, {
          ...prev.get(uid),
          status: "APEX",
          [PAGE_TITLE_KEY]: prev.get(uid)?.[PAGE_TITLE_KEY] ?? attrs[TITLE_KEY],
          [FULL_STRING_KEY]:
            prev.get(uid)?.[FULL_STRING_KEY] ??
            resolveRefs(getStringAndChildrenString(attrs).slice(0, BODY_SIZE)),
        });
      });
    },
    [setPageMap]
  );

  const upsertActiveAttrs = React.useCallback(
    (uid: string, roamPage: IncomingNode, dijkstraDiff: number) => {
      setPageMap((prev) => {
        return new Map(prev).set(uid, {
          ...prev.get(uid),
          status: "ACTIVE",
          dijkstraDiff: dijkstraDiff,
          [PAGE_TITLE_KEY]: prev.get(uid)?.[PAGE_TITLE_KEY] ?? roamPage[TITLE_KEY],
          [FULL_STRING_KEY]:
            prev.get(uid)?.[FULL_STRING_KEY] ??
            resolveRefs(getStringAndChildrenString(roamPage).slice(0, BODY_SIZE)),
        });
      });
    },
    [setPageMap]
  );

  // 🔖 setting pageMap to a new Map() here is super slow,
  // consider moving to a separate map

  const addEmbedding = React.useCallback(
    (uid: string, embedding: number[]) => {
      setPageMap((prev) => {
        return new Map(prev).set(uid, {
          ...prev.get(uid),
          embedding,
        });
      });
    },
    [setPageMap]
  );

  const addSimilarity = React.useCallback(
    (uid: string, similarity: number) => {
      setPageMap((prev) => {
        return new Map(prev).set(uid, {
          ...prev.get(uid),
          similarity,
        });
      });
    },
    [setPageMap]
  );

  const pageKeysToEmbed = React.useMemo(() => {
    return Array.from(pageMap).reduce((acc, [id, page]) => {
      if (activeOrApex(page) && !page.embedding) {
        acc.push(id);
      }
      return acc;
    }, []);
  }, [pageMap]);

  return [
    pageMap,
    clearActivePages,
    upsertApexAttrs,
    upsertActiveAttrs,
    addEmbedding,
    addSimilarity,
    pageKeysToEmbed,
  ] as const;
}

export default usePageMap;
