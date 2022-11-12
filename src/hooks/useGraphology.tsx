import Graph from "graphology";
import { singleSourceLength } from "graphology-shortest-path/unweighted";
import React from "react";
import { MIN_DISTANCES, MIN_NEIGHBORS } from "../constants";
import { isRelevantPage, nodeArrToSelectablePage, pageToNode } from "../services/graph-manip";
import { getPagesAndBlocksWithRefs } from "../services/queries";
import {
  FastPage,
  IncomingNode,
  PPAGE_KEY,
  REF_KEY,
  SHORTEST_PATH_KEY,
  TIME_KEY,
  TITLE_KEY,
  UID_KEY,
} from "../types";

function useGraphology(pagesAndBlocksFn = getPagesAndBlocksWithRefs) {
  const graph = React.useMemo(() => new Graph(), []);
  const [pageNodes, setPageNodes] = React.useState<Map<string, FastPage>>(new Map());

  const selectablePages = React.useMemo(() => {
    return Array.from(pageNodes.entries()).map(nodeArrToSelectablePage);
  }, [pageNodes]);

  const { pages: memoizedRoamPages, blocksWithRefs } = React.useMemo(
    () => pagesAndBlocksFn(),
    [pagesAndBlocksFn]
  );

  const addEdgeToGraph = React.useCallback(
    (sourceUid: string, targetUid: string) => {
      if (graph.hasNode(sourceUid) && graph.hasNode(targetUid)) {
        if (!graph.hasEdge(sourceUid, targetUid)) {
          graph.addEdge(sourceUid, targetUid);
        } else {
          graph.updateEdgeAttribute(sourceUid, targetUid, "weight", (w) => w + 1);
        }
      }
    },
    [graph]
  );

  const addNodeToGraph = React.useCallback(
    (page: IncomingNode) => {
      if (typeof page[UID_KEY] === "string" && isRelevantPage(page[TITLE_KEY], page[UID_KEY])) {
        graph.addNode(page[UID_KEY], pageToNode(page));
      }
    },
    [graph]
  );

  const initializeGraph = React.useCallback(
    async (injected_min_distance = MIN_DISTANCES) => {
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

      graph.forEachNode((node) => {
        const singleSourceLengthMap = singleSourceLength(graph, node);
        if (Object.keys(singleSourceLengthMap).length >= injected_min_distance) {
          graph.setNodeAttribute(node, SHORTEST_PATH_KEY, singleSourceLengthMap);
        }
      });

      setPageNodes((prev) => {
        const newPageNodes = new Map(prev);
        graph.forEachNode((node) => {
          const hasPaths: boolean = graph.hasNodeAttribute(node, SHORTEST_PATH_KEY);
          const hasNeighbors = graph.neighbors(node).length >= MIN_NEIGHBORS;

          if (hasPaths && hasNeighbors) {
            const {
              [TITLE_KEY]: title,
              [UID_KEY]: uid,
              [TIME_KEY]: time,
            } = memoizedRoamPages.get(node);
            newPageNodes.set(node, { title, uid, time });
          }
        });
        return newPageNodes;
      });
    },
    [graph, memoizedRoamPages, blocksWithRefs, addNodeToGraph, addEdgeToGraph]
  );

  return [graph, initializeGraph, memoizedRoamPages, selectablePages] as const;
}

export default useGraphology;
