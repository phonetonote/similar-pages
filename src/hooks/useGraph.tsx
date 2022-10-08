import Graph from "graphology";
import { singleSourceLength } from "graphology-shortest-path/unweighted";
import React from "react";
import { MIN_DISTANCES } from "../constants";
import { getPagesAndBlocksWithRefs } from "../services/queries";
import {
  IncomingNode,
  NODE_ATTRIBUTES,
  PPage,
  PPAGE_KEY,
  REF_KEY,
  SHORTEST_PATH_KEY,
  TIME_KEY,
  TITLE_KEY,
  UID_KEY,
} from "../types";

const pageToNode = (page: PPage): NODE_ATTRIBUTES => {
  return {
    title: page[TITLE_KEY],
    uid: page[UID_KEY],
    time: page[TIME_KEY],
  };
};

const isTitleOrUidDailyPage = (title: string, uid: string) => {
  return (
    /\d{2}-\d{2}-\d{4}/.test(uid) ||
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s[0-9]+(st|th|rd),\s([0-9]){4}/.test(
      title
    )
  );
};

const isRelevantPage = (title: string, uid: string): boolean => {
  return !isTitleOrUidDailyPage(title, uid) && title !== "DONE";
};

function useGraph(pagesAndBlocksFn = getPagesAndBlocksWithRefs) {
  const graph = React.useMemo(() => new Graph(), []);
  const { pages: memoizedRoamPages, blocksWithRefs } = React.useMemo(() => pagesAndBlocksFn(), []);

  const addEdgeToGraph = (sourceUid: string, targetUid: string) => {
    if (graph.hasNode(sourceUid) && graph.hasNode(targetUid)) {
      if (!graph.hasEdge(sourceUid, targetUid)) {
        graph.addEdge(sourceUid, targetUid);
      } else {
        graph.updateEdgeAttribute(sourceUid, targetUid, "weight", (w) => w + 1);
      }
    }
  };

  const addNodeToGraph = (page: IncomingNode) => {
    if (typeof page[UID_KEY] === "string" && isRelevantPage(page[TITLE_KEY], page[UID_KEY])) {
      graph.addNode(page[UID_KEY], pageToNode(page));
    }
  };

  const initializeGraph = React.useCallback(
    async (injected_min_distance = MIN_DISTANCES) => {
      console.time("createGraph");

      memoizedRoamPages.forEach(addNodeToGraph);

      for (let i = 0; i < blocksWithRefs.length; i += 1) {
        const sourceBlock = blocksWithRefs[i][0];
        const sourceBlockPageUid = sourceBlock?.[PPAGE_KEY]?.[UID_KEY];

        if (sourceBlockPageUid) {
          const sourceRefs = sourceBlock?.[REF_KEY] ?? [];

          for (let j = 0; j < sourceRefs.length; j += 1) {
            const targetRef = sourceRefs[j];

            if (targetRef[TITLE_KEY]) {
              addEdgeToGraph(sourceBlockPageUid, targetRef[UID_KEY]);
            } else if (targetRef[PPAGE_KEY]) {
              addEdgeToGraph(sourceBlockPageUid, targetRef[PPAGE_KEY][UID_KEY]);
            }
          }
        }
      }

      graph.forEachNode((node, _) => {
        const singleSourceLengthMap = singleSourceLength(graph, node);
        if (Object.keys(singleSourceLengthMap).length >= injected_min_distance) {
          graph.setNodeAttribute(node, SHORTEST_PATH_KEY, singleSourceLengthMap);
        }
      });
    },
    [graph, memoizedRoamPages, blocksWithRefs]
  );

  return [graph, initializeGraph, memoizedRoamPages] as const;
}

export default useGraph;
