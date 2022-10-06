import Graph from "graphology";
import { singleSourceLength } from "graphology-shortest-path/unweighted";
import React from "react";
import { MIN_DISTANCES } from "../constants";
import { getPagesAndBlocksWithRefs, isRelevantPage, pageToNode } from "../services/queries";
import { IncomingNode, PPAGE_KEY, REF_KEY, SHORTEST_PATH_KEY, TITLE_KEY, UID_KEY } from "../types";

function useGraph() {
  const graph = React.useMemo(() => new Graph(), []);
  const { pages: memoizedRoamPages, blocksWithRefs } = React.useMemo(
    () => getPagesAndBlocksWithRefs(),
    []
  );

  const addEdgeToGraph = (sourceTitle: string, targetTitle: string) => {
    if (graph.hasNode(sourceTitle) && graph.hasNode(targetTitle)) {
      if (!graph.hasEdge(sourceTitle, targetTitle)) {
        graph.addEdge(sourceTitle, targetTitle);
      } else {
        graph.updateEdgeAttribute(sourceTitle, targetTitle, "weight", (w) => w + 1);
      }
    }
  };

  const addNodeToGraph = (page: IncomingNode) => {
    if (typeof page[TITLE_KEY] === "string" && isRelevantPage(page[TITLE_KEY], page[UID_KEY])) {
      graph.addNode(page[TITLE_KEY], pageToNode(page));
    }
  };

  const initializeGraph = async () => {
    console.time("createGraph");

    memoizedRoamPages.forEach(addNodeToGraph);

    for (let i = 0; i < blocksWithRefs.length; i += 1) {
      const sourceBlock = blocksWithRefs[i][0];
      const sourceBlockPageTitle = sourceBlock?.[PPAGE_KEY]?.[TITLE_KEY];

      if (sourceBlockPageTitle) {
        const sourceRefs = sourceBlock?.[REF_KEY] ?? [];

        for (let j = 0; j < sourceRefs.length; j += 1) {
          const targetRef = sourceRefs[j];
          if (targetRef[TITLE_KEY]) {
            addEdgeToGraph(sourceBlockPageTitle, targetRef[TITLE_KEY]);
          } else if (targetRef[PPAGE_KEY]) {
            addEdgeToGraph(sourceBlockPageTitle, targetRef[PPAGE_KEY][TITLE_KEY]);
          }
        }
      }
    }

    graph.forEachNode((node, _) => {
      const singleSourceLengthMap = singleSourceLength(graph, node);
      if (Object.keys(singleSourceLengthMap).length > MIN_DISTANCES) {
        graph.setNodeAttribute(node, SHORTEST_PATH_KEY, singleSourceLengthMap);
      }
    });
  };

  return [graph, initializeGraph, memoizedRoamPages] as const;
}

export default useGraph;
