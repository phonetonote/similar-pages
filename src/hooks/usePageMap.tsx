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
  EmbeddablePageOutput,
} from "../types";
import { dot } from "mathjs";

function usePageMap() {
  const [activePageIds, setActivePageIds] = React.useState<string[]>([]);
  const [apexPageId, setApexPageId] = React.useState<string>();
  const [dijkstraDiffMap, setDijkstraDiffMap] = React.useState<GPDijkstraDiffMap>(new Map());
  const [fullStringMap, setFullStringMap] = React.useState<GPFullStringMap>(new Map());
  const [embeddingMap, setEmbeddingMap] = React.useState<GPEmbeddingMap>(new Map());
  const [similarityMap, setSimilarityMap] = React.useState<GpSimiliarityMap>(new Map());
  const [titleMap, setTitleMap] = React.useState<GPTitleMap>(new Map());

  const hasAllEmbeddings = React.useMemo(() => {
    return activePageIds.every((id) => embeddingMap.has(id));
  }, [activePageIds, embeddingMap]);

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

  const addEmbeddings = React.useCallback((embeddings: EmbeddablePageOutput[]) => {
    setEmbeddingMap((prev) => {
      const newMap = new Map(prev);
      embeddings.forEach((e) => {
        newMap.set(e.id, e.embedding);
      });
      return newMap;
    });
  }, []);

  const addSimilarities = React.useCallback(
    (embeddingMap: GPEmbeddingMap) => {
      const apexEmbedding = embeddingMap.get(apexPageId);
      setSimilarityMap((prev) => {
        const newMap = new Map(prev);
        embeddingMap.forEach((embedding, uid) => {
          newMap.set(uid, dot(embedding, apexEmbedding));
        });
        return newMap;
      });
    },
    [apexPageId]
  );

  const pageKeysToEmbed = React.useMemo(() => {
    return [...activePageIds, apexPageId].filter((p) => !embeddingMap.has(p));
  }, [activePageIds, apexPageId]);

  return [
    clearActivePages,
    upsertApexAttrs,
    upsertActiveAttrs,
    addEmbeddings,
    addSimilarities,
    pageKeysToEmbed,
    embeddingMap,
    fullStringMap,
    dijkstraDiffMap,
    similarityMap,
    titleMap,
    hasAllEmbeddings,
  ] as const;
}

export default usePageMap;
