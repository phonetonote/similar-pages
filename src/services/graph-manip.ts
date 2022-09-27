// Credit to Stephen Solka, creator of logseq-graph-analysis
// https://github.com/trashhalo/logseq-graph-analysis

import { BlockWithRefs, NEIGHBOR_MAP, RichRef, TargetSource } from "../types";
// import getBlockUidsReferencingBlock from "roamjs-components/queries/getBlockUidsReferencingBlock";
import getPageUidByBlockUid from "roamjs-components/queries/getPageUidByBlockUid";
import Graph from "graphology";
import { Attributes } from "graphology-types";
import { toUndirected } from "graphology-operators";
import { dijkstra, edgePathFromNodePath } from "graphology-shortest-path";
import { isTitleOrUidDailyPage } from "./queries";
import { MIN_NEIGHBORS } from "../constants";

interface ResultMap {
  [to: string]: { measure: number; extra: string[] };
}

function intersection(nodes1: string[], nodes2: string[]) {
  return nodes1?.filter((node1) => nodes2.includes(node1)) ?? [];
}

function roundNumber(num: number, dec: number = 4): number {
  return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
}

function sum(arr: number[]) {
  if (arr.length === 0) {
    return 0;
  }
  return arr.reduce((a, b) => a + b);
}

function ademicAdar(graph: Graph, pageTitle: string) {
  const results: ResultMap = {};
  const aAttributes = graph.getNodeAttributes(pageTitle);
  const Na = aAttributes.neighbors;

  graph.forEachNode((innerPageTitle, attributes) => {
    const Nb = attributes.neighbors;
    const Nab = intersection(Na, Nb);
    let measure = Infinity;
    if (Nab.length) {
      const neighbours: number[] = Nab.map(
        (n) => graph.getNodeAttribute(n, "outerNeighbors").length
      );
      measure = roundNumber(sum(neighbours.map((neighbour) => 1 / Math.log(neighbour))));
    }
    results[innerPageTitle] = { measure, extra: Nab };
  });

  return results;
}

// shortest is better
function shortestDirectedPathLength(graph: Graph, nodeA: string, nodeB: string) {
  if (!nodeA || !nodeB) {
    return Infinity;
  }

  const nodes =
    dijkstra.bidirectional(graph, nodeA, nodeB) || dijkstra.bidirectional(graph, nodeB, nodeA);

  return nodes?.length ?? Infinity;
}

// shortest is better
// too slow
// function shortestUndirectedPathLength(undirectedGraph: Graph, nodeA: string, nodeB: string) {
//   if (!nodeA && !nodeB) {
//     return Infinity;
//   }

//   const nodes = dijkstra.bidirectional(undirectedGraph, nodeA, nodeB);
//   return nodes?.length ?? Infinity;
// }

const unique = (value: string, index: number, self: string[]) => {
  return self.indexOf(value) === index;
};

export { ademicAdar, shortestDirectedPathLength, unique };
