// Credit to Stephen Solka, creator of logseq-graph-analysis
// https://github.com/trashhalo/logseq-graph-analysis

import { BlockWithRefs, RichRef, TargetSource } from "../types";
// import getBlockUidsReferencingBlock from "roamjs-components/queries/getBlockUidsReferencingBlock";
import getPageUidByBlockUid from "roamjs-components/queries/getPageUidByBlockUid";
import Graph from "graphology";
import { Attributes } from "graphology-types";
import { toUndirected } from "graphology-operators";
import { dijkstra, edgePathFromNodePath } from "graphology-shortest-path";

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

function ademicAdarPoint(graph: Graph, nodeA: string, nodeB: string) {
  const Na = graph.neighbors(nodeA);
  const Nb = graph.neighbors(nodeB);
  const Nab = intersection(Na, Nb);

  let measure = Infinity;
  if (Nab.length) {
    const neighbours: number[] = Nab.map((n) => graph.outNeighbors(n).length);
    measure = roundNumber(sum(neighbours.map((neighbour) => 1 / Math.log(neighbour))));
  }
  return measure;
}

function ademicAdar(graph: Graph, node: string) {
  const results: ResultMap = {};
  const Na = graph.neighbors(node);

  graph.forEachNode((to) => {
    const Nb = graph.neighbors(to);
    const Nab = intersection(Na, Nb);
    let measure = Infinity;
    if (Nab.length) {
      const neighbours: number[] = Nab.map((n) => graph.outNeighbors(n).length);
      measure = roundNumber(sum(neighbours.map((neighbour) => 1 / Math.log(neighbour))));
    }
    results[to] = { measure, extra: Nab };
  });

  return results;
}

// shortest is better
function shortestDirectedPathLength(graph: Graph, nodeA: string, nodeB: string) {
  if (!nodeA || !nodeB) {
    return Infinity;
  }

  const nodes =
    dijkstra.bidirectional(graph, nodeA, nodeB) || dijkstra.bidirectional(graph, nodeA, nodeB);

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

export { ademicAdar, ademicAdarPoint, shortestDirectedPathLength };
