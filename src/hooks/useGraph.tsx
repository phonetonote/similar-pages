import Graph from "graphology";
import { singleSourceLength } from "graphology-shortest-path/unweighted";
import React from "react";
import { MIN_DISTANCES } from "../constants";
import { getPagesAndBlocksWithRefs, pageToNode } from "../services/queries";
import { IncomingNode, PPAGE_KEY, REF_KEY, SHORTEST_PATH_KEY, TITLE_KEY, UID_KEY } from "../types";

const isTitleOrUidDailyPage = (title: string, uid: string) => {
  return (
    /\d{2}-\d{2}-\d{4}/.test(uid) ||
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s[0-9]+(st|th|rd),\s([0-9]){4}/.test(
      title
    )
  );
};

const isRelevantPage = (title: string, uid: string): boolean => {
  // console.log("PTNLOG!! isRelevantPage?", !isTitleOrUidDailyPage(title, uid) && title !== "DONE");
  return !isTitleOrUidDailyPage(title, uid) && title !== "DONE";
};

// TODO add some jest tests for this hook
// stub out getPagesAndBlocksWithRefs and test
// that the graph is initialized correctly

function useGraph(pagesAndBlocksFn = getPagesAndBlocksWithRefs) {
  const graph = React.useMemo(() => new Graph(), []);
  const { pages: memoizedRoamPages, blocksWithRefs } = React.useMemo(() => pagesAndBlocksFn(), []);

  const addEdgeToGraph = (sourceTitle: string, targetTitle: string) => {
    // console.log("PTNLOG!! addEdgeToGraph", sourceTitle, targetTitle);
    if (graph.hasNode(sourceTitle) && graph.hasNode(targetTitle)) {
      // console.log("PTNLOG!! addEdgeToGraph2", sourceTitle, targetTitle);

      if (!graph.hasEdge(sourceTitle, targetTitle)) {
        graph.addEdge(sourceTitle, targetTitle);
      } else {
        graph.updateEdgeAttribute(sourceTitle, targetTitle, "weight", (w) => w + 1);
      }
    }
  };

  const addNodeToGraph = (page: IncomingNode) => {
    // console.log("PTNLOG!! page", page);
    if (typeof page[TITLE_KEY] === "string" && isRelevantPage(page[TITLE_KEY], page[UID_KEY])) {
      // console.log("PTNLOG!! adding node to graph", page[TITLE_KEY]);
      graph.addNode(page[TITLE_KEY], pageToNode(page));
    }
  };

  const initializeGraph = async (injected_min_distance = MIN_DISTANCES) => {
    console.time("createGraph");

    memoizedRoamPages.forEach(addNodeToGraph);

    for (let i = 0; i < blocksWithRefs.length; i += 1) {
      // console.log("PTNLOG!! blocksWithRefs[i]", blocksWithRefs[i]);
      const sourceBlock = blocksWithRefs[i][0];
      const sourceBlockPageTitle = sourceBlock?.[PPAGE_KEY]?.[TITLE_KEY];

      if (sourceBlockPageTitle) {
        const sourceRefs = sourceBlock?.[REF_KEY] ?? [];

        for (let j = 0; j < sourceRefs.length; j += 1) {
          const targetRef = sourceRefs[j];
          // console.log("PTNLOG!! targetRef", targetRef);
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
      if (Object.keys(singleSourceLengthMap).length >= injected_min_distance) {
        graph.setNodeAttribute(node, SHORTEST_PATH_KEY, singleSourceLengthMap);
      }
    });
  };

  return [graph, initializeGraph, memoizedRoamPages] as const;
}

export default useGraph;
