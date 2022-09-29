import React from "react";
import gridStyles from "../styles/grid.module.css";
import styles from "../styles/sp-body.module.css";
import * as tf from "@tensorflow/tfjs-core";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import "@tensorflow/tfjs-backend-webgl";
import {
  isTitleOrUidDailyPage,
  getPagesAndBlocksWithRefs,
  pageToNodeAttributes,
  getStringAndChildrenString,
  isRelevantPage,
} from "../services/queries";
import {
  EMBEDDING_KEY,
  FULL_STRING_KEY,
  IncomingNode,
  PPage,
  PPAGE_KEY,
  PRef,
  REF_KEY,
  ResultWithTitle,
  RoamData,
  SelectablePage,
  SHORTEST_PATH_KEY,
  SP_MODE,
  SP_STATUS,
  STRING_KEY,
  TITLE_KEY,
  UID_KEY,
} from "../types";
import Graph from "graphology";
import DebugObject from "./debug-object";
import { Spinner, SpinnerSize, ProgressBar, Card, IconName } from "@blueprintjs/core";
import PageSelect from "./page/page-select";
import SpGraph from "./graph/sp-graph";
import { ademicAdar, unique } from "../services/graph-manip";
import { singleSource, singleSourceLength } from "graphology-shortest-path/unweighted";
import dijkstra from "graphology-shortest-path/dijkstra";

import ModeSelect from "./mode-select";
import { Result } from "roamjs-components/types/query-builder";
import resolveRefs from "roamjs-components/dom/resolveRefs";
import { BODY_SIZE, CHUNK_SIZE } from "../constants";
import { string } from "mathjs";
import { initializeEmbeddingWorker } from "../services/embedding-worker-client";

export const SpBody = () => {
  const graph = React.useMemo(() => {
    return new Graph({
      // type: "undirected",
    });
  }, []);

  const nodeToSelectablePage = (n: string) => ({
    title: graph.getNodeAttribute(n, "title"),
    id: graph.getNodeAttribute(n, "uid"),
    icon: "document" as IconName,
  });

  const model = React.useRef<use.UniversalSentenceEncoder>();

  // current thinking is this won't need to be state
  // const [activePages, setActivePages] = React.useState<SelectablePage[]>([]);
  const [selectablePageTitles, setSelectablePageTitles] = React.useState<string[]>([]);
  const [selectedPage, setSelectedPage] = React.useState<SelectablePage>();
  const [status, setStatus] = React.useState<SP_STATUS>("CREATING_GRAPH");
  const cachedRoamPages = React.useRef<RoamData>();

  const markNodesActive = (pageTitle: string, roamPages?: RoamData) => {
    console.log("PTNLOG: markNodesActive", pageTitle);
    const singleSourceLengthMap = singleSourceLength(graph, pageTitle);

    graph.nodes().forEach((n, attrs) => {
      if (singleSourceLengthMap[n]) {
        graph.setNodeAttribute(n, SHORTEST_PATH_KEY, singleSourceLengthMap[n]);
        graph.setNodeAttribute(n, "active", true);

        const node = roamPages?.get(n);
        if (node && !graph.hasNodeAttribute(n, FULL_STRING_KEY)) {
          graph.updateNodeAttribute(n, FULL_STRING_KEY, () =>
            resolveRefs(getStringAndChildrenString(node)).slice(0, BODY_SIZE)
          );
        }
      } else {
        graph.setNodeAttribute(n, "active", false);
      }
    });
  };

  const setNonDailyTitles = () => {
    setSelectablePageTitles(
      graph.filterNodes((node, attributes) => {
        return graph.edges(node).length > 0;
      })
    );

    setStatus("READY");
  };

  const selectablePages = React.useMemo(() => {
    return graph
      ? graph.filterNodes((node) => selectablePageTitles.includes(node)).map(nodeToSelectablePage)
      : [];
  }, [selectablePageTitles]);

  const addEdgeToGraph = (sourceTitle: string, targetTitle: string) => {
    if (graph.hasNode(sourceTitle) && graph.hasNode(targetTitle)) {
      if (!graph.hasEdge(sourceTitle, targetTitle)) {
        graph.addEdge(sourceTitle, targetTitle);
      } else {
        graph.updateEdgeAttribute(sourceTitle, targetTitle, "weight", (w) => w + 1);
      }
    }
  };

  const addNodeToGraph = (page: IncomingNode, key: string, map: Map<string, IncomingNode>) => {
    if (typeof page[TITLE_KEY] === "string" && isRelevantPage(page[TITLE_KEY], page[UID_KEY])) {
      graph.addNode(page[TITLE_KEY], pageToNodeAttributes(page));
    }
  };

  React.useEffect(() => {
    if (status === "CREATING_GRAPH" && graph && graph.size === 0) {
      // setTimeout helps perceived performance by allowing the
      // loading spinner to render before blocking main thread to build graph
      window.setTimeout(() => createGraph(), 100);
    }

    const createGraph = async () => {
      console.time("createGraph");

      const { pages, blocksWithRefs } = getPagesAndBlocksWithRefs();
      cachedRoamPages.current = pages;

      pages.forEach(addNodeToGraph);

      for (let i = 0; i < blocksWithRefs.length; i += 1) {
        const sourceBlock: PRef = blocksWithRefs[i][0];
        const sourceBlockPageTitle = sourceBlock?.[PPAGE_KEY]?.[TITLE_KEY];

        if (sourceBlockPageTitle) {
          const sourceRefs = sourceBlock?.[REF_KEY] ?? [];

          for (let j = 0; j < sourceRefs.length; j += 1) {
            const targetRef: IncomingNode = sourceRefs[j];
            if (targetRef[TITLE_KEY]) {
              addEdgeToGraph(sourceBlockPageTitle, targetRef[TITLE_KEY]);
            } else if (targetRef[PPAGE_KEY]) {
              addEdgeToGraph(sourceBlockPageTitle, targetRef[PPAGE_KEY][TITLE_KEY]);
            }
          }
        }
      }

      // LATER add paths-with-refs once I understand what they are
      // https://github.com/trashhalo/logseq-graph-analysis/commit/90250ad1785a7c46be0b5240383aca653f540859
      // https://discuss.logseq.com/t/what-are-path-refs/10413

      console.log("graph", graph);

      setStatus("READY_TO_SET_PAGES");
      console.timeEnd("createGraph");
    };
  }, [graph, status]);

  React.useEffect(() => {
    if (status === "READY_TO_SET_PAGES" && selectablePageTitles.length === 0) {
      console.log("setting non-daily titles");
      setNonDailyTitles();
    }
  }, [status, selectablePageTitles]);

  const renderLoading = status === "CREATING_GRAPH";
  const renderInModalLoading = status === "GETTING_GRAPH_STATS";

  const getGraphStats = async (page: SelectablePage) => {
    console.log("getGraphStats top", graph);
    console.log("getGraphStats cachedRoamPages", cachedRoamPages);

    markNodesActive(page.title, cachedRoamPages.current);

    console.log("getGraphStats middle", graph);

    if (!model.current) {
      tf.setBackend("webgl");
      model.current = await use.load();
    }

    const activeFullStrings = graph.reduceNodes(
      (acc, node, attributes) => {
        if (attributes["active"] && !attributes[EMBEDDING_KEY]) {
          acc.needsEmbedding.push({
            [FULL_STRING_KEY]: attributes[FULL_STRING_KEY],
            title: node,
          });
        } else if (attributes["active"] && attributes[EMBEDDING_KEY]) {
          acc.hasEmbedding.push({
            [EMBEDDING_KEY]: attributes[EMBEDDING_KEY] as string,
            title: node,
            [FULL_STRING_KEY]: attributes[FULL_STRING_KEY],
          });
        }
        return acc;
      },
      { needsEmbedding: [], hasEmbedding: [] } as {
        needsEmbedding: { fullString: string; title: string }[];
        hasEmbedding: { fullString: string; title: string; [EMBEDDING_KEY]: string }[];
      }
    );

    console.log("activeFullStrings", activeFullStrings);

    const chunkSize = CHUNK_SIZE;
    for (let i = 0; i < activeFullStrings.needsEmbedding.length; i += chunkSize) {
      const chunk = activeFullStrings.needsEmbedding.slice(i, i + chunkSize);
      initializeEmbeddingWorker(chunk).then((worker) => {
        worker?.postMessage({
          method: "fireQuery",
          baz: "qux",
        });
      });

      // const embeddings = await model.current.embed(chunk.map((f) => f.fullString));
      // const embeddingValues = await embeddings.array();

      // console.log("embeddings", embeddings);
      // console.log("embeddingValues", embeddingValues);
    }

    setStatus("READY");

    console.log("getGraphStats end", graph);
  };

  const pageSelectCallback = React.useCallback((page: SelectablePage) => {
    console.log("pageSelectCallback", page);
    if (page) {
      setSelectedPage(page);
    }
  }, []);

  React.useEffect(() => {
    console.log("selectedPage", selectedPage);
    if (selectedPage) {
      setStatus("GETTING_GRAPH_STATS");
      getGraphStats(selectedPage);
    }
  }, [selectedPage]);

  return renderLoading ? (
    <Spinner></Spinner>
  ) : (
    <div className={gridStyles.container}>
      <div className={gridStyles.side}>
        <Card elevation={1}>
          <h5 className={styles.title}>selected page</h5>
          <PageSelect
            selectablePages={selectablePages}
            onPageSelect={pageSelectCallback}
          ></PageSelect>
        </Card>
      </div>
      <div className={gridStyles.body}>
        <div className={styles.graph}>
          <div className={styles.graphinner}>
            {renderInModalLoading ? <Spinner></Spinner> : "ready for graph"}
            {/* <SpGraph graph={graph} selectedPage={selectedPage}></SpGraph> */}
          </div>
        </div>
        <DebugObject obj={graph.inspect()} />
        <DebugObject obj={selectedPage} />
        <DebugObject obj={selectablePageTitles.length} />
      </div>
    </div>
  );
};
