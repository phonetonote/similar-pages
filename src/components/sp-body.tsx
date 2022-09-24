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
} from "../services/queries";
import {
  FULL_STRING_KEY,
  IncomingNode,
  NEIGHBOR_MAP,
  PPage,
  PPAGE_KEY,
  PRef,
  REF_KEY,
  ResultWithTitle,
  RoamData,
  SelectablePage,
  SelectablePageList,
  SP_MODE,
  SP_STATUS,
  STRING_KEY,
  TITLE_KEY,
} from "../types";
import Graph from "graphology";
import DebugObject from "./debug-object";
import { Spinner, SpinnerSize, ProgressBar, Card, IconName } from "@blueprintjs/core";
import PageListSelect from "./page-list/page-list-select";
import PageSelect from "./page/page-select";
import SpGraph from "./graph/sp-graph";
import { ademicAdar, unique } from "../services/graph-manip";
import { DEFAULT_MODE, LAST_100_PAGES, MIN_NEIGHBORS, SELECTABLE_PAGE_LISTS } from "../constants";
import ModeSelect from "./mode-select";
import { Result } from "roamjs-components/types/query-builder";
import resolveRefs from "roamjs-components/dom/resolveRefs";

export const SpBody = () => {
  const graph = React.useMemo(() => {
    return new Graph();
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
  const [mode, setMode] = React.useState<SP_MODE>(DEFAULT_MODE);
  const [cachedRoamPages, setCachedRoamPages] = React.useState<RoamData>();

  const setTop100Titles = () => {
    setSelectablePageTitles(
      graph
        .filterNodes((_, attributes) => attributes.isNonDailyPage)
        .sort((a, b) => graph.getNodeAttribute(b, "time") - graph.getNodeAttribute(a, "time"))
        .slice(0, 100)
    );
  };

  const addNeighborsToGraph = () => {
    if (!graph.hasNodeAttribute(graph.nodes()[0], "neighbors")) {
      graph.forEachNode((to) => {
        if (!isTitleOrUidDailyPage(to, graph.getNodeAttribute(to, "uid"))) {
          graph.setNodeAttribute(to, "isNonDailyPage", true);
          const neighbors = graph
            .neighbors(to)
            .filter((neighborTitle) => {
              return !isTitleOrUidDailyPage(
                neighborTitle,
                graph.getNodeAttribute(neighborTitle, "uid")
              );
            })
            .filter(unique);
          const outerNeighbors = graph
            .outNeighbors(to)
            .filter((neighborTitle) => {
              return !isTitleOrUidDailyPage(
                neighborTitle,
                graph.getNodeAttribute(neighborTitle, "uid")
              );
            })
            .filter(unique);

          graph.setNodeAttribute(to, "neighbors", neighbors);
          graph.setNodeAttribute(to, "outerNeighbors", outerNeighbors);
        } else {
          graph.setNodeAttribute(to, "isNonDailyPage", false);
          graph.setNodeAttribute(to, "neighbors", []);
          graph.setNodeAttribute(to, "outerNeighbors", []);
        }
      });
    }
  };

  const setNonDailyTitles = () => {
    addNeighborsToGraph();
    setSelectablePageTitles(
      graph.filterNodes((_, attributes) => {
        return attributes["isNonDailyPage"] && attributes["neighbors"].length >= MIN_NEIGHBORS;
      })
    );
  };

  const selectablePages = React.useMemo(() => {
    return graph
      ? graph.filterNodes((node) => selectablePageTitles.includes(node)).map(nodeToSelectablePage)
      : [];
  }, [selectablePageTitles]);

  const setNewPagelist = async (newPageList: SelectablePageList) => {
    selectablePageTitles.forEach((pageTitle) => {
      graph.updateNodeAttribute(pageTitle, "active", () => false);
    });
    if (newPageList.id === LAST_100_PAGES.id) {
      setTop100Titles();
    } else if (newPageList.icon === SELECTABLE_PAGE_LISTS[SELECTABLE_PAGE_LISTS.length - 1].icon) {
      const resultsFromQuery = (await window.roamjs.extension.queryBuilder.runQuery(
        newPageList.id
      )) as Result[];

      const relPages: ResultWithTitle[] = resultsFromQuery.filter(
        (r: Result) => r[":node/title"]
      ) as ResultWithTitle[];

      setSelectablePageTitles(relPages.map((r) => r[":node/title"]));
    }
  };

  const addEdgeToGraph = (sourceTitle: string, targetTitle: string) => {
    if (graph.hasNode(sourceTitle) && graph.hasNode(targetTitle)) {
      if (!graph.hasEdge(sourceTitle, targetTitle)) {
        graph.addEdge(sourceTitle, targetTitle);
      } else {
        graph.updateEdgeAttribute(sourceTitle, targetTitle, "weight", (w) => w + 1);
      }
    }
  };

  const addNodeToGraph = (page: PPage) => {
    graph.addNode(page[TITLE_KEY], pageToNodeAttributes(page));
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
      setCachedRoamPages(pages);

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

      setNonDailyTitles();
      setStatus("READY");
      console.timeEnd("createGraph");
    };
  }, [graph, status]);

  React.useEffect(() => {
    if (status === "READY") {
      mode === "neighbors" ? setNonDailyTitles() : setTop100Titles();
    }
  }, [mode, status]);

  const renderLoading = status !== "READY";

  const updateSelectablePages = React.useCallback((pageList) => {
    console.log("updateGraphWithPagelist", pageList);
    setNewPagelist(pageList);
  }, []);

  const getGraphStats = async (page: SelectablePage, roamPages: RoamData) => {
    setSelectedPage(page);
    console.log("neighbors hopefully on graph here", graph);
    const scores = ademicAdar(graph, page.title);
    const activePageTitles = [];

    if (!model.current) {
      tf.setBackend("webgl");
      model.current = await use.load();
    }

    for (var [pageTitle, data] of Object.entries(scores)) {
      if (data.measure < Infinity) {
        // should we be updating a local state type thing here instead of the graph?
        // LATER add other metric options
        graph.updateNodeAttribute(pageTitle, "adamicAdar", () => data.measure);
        graph.updateNodeAttribute(pageTitle, "active", () => true);
        activePageTitles.push(pageTitle);
      }
    }

    const activeNodes = activePageTitles.map((pageTitle) => roamPages.get(pageTitle));

    console.log("activePageTitles", activePageTitles);
    console.log("activeNodes", activeNodes);

    // TODO

    // need to cache fullStrings and embeddings how we are neighbors,
    // probably all in a big map

    activeNodes.forEach((node) => {
      if (
        node &&
        graph.hasNode(node[TITLE_KEY]) &&
        !graph.hasNodeAttribute(node[TITLE_KEY], FULL_STRING_KEY)
      ) {
        graph.updateNodeAttribute(node[TITLE_KEY], FULL_STRING_KEY, () =>
          resolveRefs(getStringAndChildrenString(node))
        );
      }
    });

    const embeddings = await model.current.embed([...fullStringMap.values()]);
    const embeddingValues = await embeddings.array();

    console.log("embeddingValues", embeddingValues);
    // 🔖 need to fix loading issue by running initial graph calculations before loading is done
  };

  const pageSelectCallback = React.useCallback(
    (page: SelectablePage) => {
      console.log("pageSelectCallback", page);
      if (page) {
        getGraphStats(page, cachedRoamPages);
      }
    },
    [cachedRoamPages]
  );

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

        <Card elevation={1}>
          <h5 className={styles.title}>mode</h5>
          <ModeSelect mode={mode} setMode={setMode} />
        </Card>

        {mode === "queries" && (
          <Card elevation={1}>
            <h5 className={styles.title}>page list</h5>
            <PageListSelect onPageListSelect={updateSelectablePages}></PageListSelect>
          </Card>
        )}
      </div>
      <div className={gridStyles.body}>
        <div className={styles.graph}>
          <div className={styles.graphinner}>
            <SpGraph graph={graph} selectedPage={selectedPage}></SpGraph>
          </div>
        </div>
        <DebugObject obj={graph.inspect()} />
        <DebugObject obj={selectedPage} />
        <DebugObject obj={selectablePageTitles.length} />
      </div>
    </div>
  );
};
