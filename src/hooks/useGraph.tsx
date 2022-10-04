import Graph from "graphology";
import { Attributes } from "graphology-types";
import React from "react";
import { isRelevantPage, pageToNodeAttributes } from "../services/queries";
import { IncomingNode, TITLE_KEY, UID_KEY } from "../types";

function useGraph() {
  const graph: Graph<Attributes, Attributes, Attributes> = React.useMemo(() => {
    return new Graph({
      // type: "undirected",
    });
  }, []) as Graph<Attributes, Attributes, Attributes>;

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

  return [graph, addEdgeToGraph, addNodeToGraph] as const;
}

export default useGraph;
