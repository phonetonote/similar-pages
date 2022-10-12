import React from "react";
import resolveRefs from "roamjs-components/dom/resolveRefs";
import { BODY_SIZE } from "../constants";
import { getStringAndChildrenString } from "../services/queries";
import {
  GPDijkstraDiffMap,
  GPEmbeddingMap,
  GPFullStringMap,
  GpSimiliarityMap,
  GPTitleMap,
  IncomingNode,
  TITLE_KEY,
} from "../types";

function usePageMap() {
  const [activePageIds, setActivePageIds] = React.useState<string[]>([]);
  const [apexPageId, setApexPageId] = React.useState<string>();
  const [dijkstraDiffMap, setDijkstraDiffMap] = React.useState<GPDijkstraDiffMap>(new Map());
  const [fullStringMap, setFullStringMap] = React.useState<GPFullStringMap>(new Map());
  const [embeddingMap, setEmbeddingMap] = React.useState<GPEmbeddingMap>(new Map());
  const [similarityMap, setSimilarityMap] = React.useState<GpSimiliarityMap>(new Map());
  const [titleMap, setTitleMap] = React.useState<GPTitleMap>(new Map());

  const clearActivePages = React.useCallback(() => {
    setActivePageIds(() => {
      return [];
    });
  }, [setActivePageIds]);

  const upsertApexAttrs = React.useCallback(
    (uid: string, attrs: IncomingNode) => {
      setApexPageId(uid);

      setTitleMap((prev) => {
        return new Map(prev).set(uid, prev.get(uid) || attrs[TITLE_KEY]);
      });

      setFullStringMap((prev) => {
        return new Map(prev).set(
          uid,
          prev.get(uid) || resolveRefs(getStringAndChildrenString(attrs).slice(0, BODY_SIZE))
        );
      });
    },
    [setApexPageId, setTitleMap, setFullStringMap]
  );

  const upsertActiveAttrs = React.useCallback(
    (uid: string, roamPage: IncomingNode, dijkstraDiff: number) => {
      setActivePageIds((prev) => {
        const newArr = [...prev];
        newArr.push(uid);
        return newArr;
      });
      setDijkstraDiffMap((prev) => {
        return new Map(prev).set(uid, dijkstraDiff);
      });
      setTitleMap((prev) => {
        return new Map(prev).set(uid, prev.get(uid) || roamPage[TITLE_KEY]);
      });
      setFullStringMap((prev) => {
        return new Map(prev).set(
          uid,
          prev.get(uid) || resolveRefs(getStringAndChildrenString(roamPage))
        );
      });
    },
    [setActivePageIds, setDijkstraDiffMap, setTitleMap, setFullStringMap]
  );

  // 🔖 setting pageMap to a new Map() here is super slow,
  // consider moving to a separate map

  const addEmbedding = React.useCallback((uid: string, embedding: number[]) => {
    setEmbeddingMap((prev) => {
      return new Map(prev).set(uid, embedding);
      // return new Map(prev).set(uid, embedding);
      // return new Map(prev).set(uid, [Math.random(), Math.random()]);
    });
  }, []);

  const addSimilarity = React.useCallback(
    (uid: string, similarity: number) => {
      setSimilarityMap((prev) => {
        return new Map(prev).set(uid, similarity);
      });
    },
    [setSimilarityMap]
  );

  const pageKeysToEmbed = React.useMemo(() => {
    return [...activePageIds, apexPageId];
  }, [activePageIds, apexPageId]);

  return [
    clearActivePages,
    upsertApexAttrs,
    upsertActiveAttrs,
    addEmbedding,
    addSimilarity,
    pageKeysToEmbed,
    embeddingMap,
    apexPageId,
    fullStringMap,
    dijkstraDiffMap,
    similarityMap,
    titleMap,
  ] as const;
}

export default usePageMap;
