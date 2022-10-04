import Graph from "graphology";
import React from "react";
import {
  getPagesAndBlocksWithRefs,
  isRelevantPage,
  pageToNodeAttributes,
} from "../services/queries";
import { IncomingNode, PPAGE_KEY, REF_KEY, TITLE_KEY, UID_KEY } from "../types";

function useGraph() {
  const graph = React.useMemo(() => new Graph(), []);

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
      graph.addNode(page[TITLE_KEY], pageToNodeAttributes(page));
    }
  };

  const initializeGraph = async () => {
    console.time("createGraph");

    const { pages, blocksWithRefs } = getPagesAndBlocksWithRefs();

    pages.forEach(addNodeToGraph);

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
  };

  return [graph, initializeGraph] as const;
}

export default useGraph;
