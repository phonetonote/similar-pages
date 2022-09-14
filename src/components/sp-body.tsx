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
} from "../services/queries";
import {
  IncomingNode,
  PPage,
  PPAGE_KEY,
  PRef,
  REF_KEY,
  ResultWithTitle,
  SelectablePage,
  SelectablePageList,
  SP_MODE,
  SP_STATUS,
  TIME_KEY,
  TITLE_KEY,
  UID_KEY,
} from "../types";
import Graph from "graphology";
import DebugObject from "./debug-object";
import { Spinner, SpinnerSize, ProgressBar, Card, IconName } from "@blueprintjs/core";
import PageListSelect from "./page-list/page-list-select";
import PageSelect from "./page/page-select";
import SpGraph from "./graph/sp-graph";
import { ademicAdarPoint, shortestDirectedPathLength } from "../services/graph-manip";
import { DEFAULT_MODE, LAST_100_PAGES, SELECTABLE_PAGE_LISTS } from "../constants";
import ModeSelect from "./mode-select";
import { Result } from "roamjs-components/types/query-builder";

export const SpBody = () => {
  const graph = React.useMemo(() => {
    return new Graph();
  }, []);

  const nodeToSelectablePage = (n: string) => ({
    title: graph.getNodeAttribute(n, "title"),
    id: graph.getNodeAttribute(n, "uid"),
    icon: "document" as IconName,
  });

  const model = React.useMemo(() => {
    const loadModel = async () => {
      tf.setBackend("webgl");
      return await use.load();
    };

    return loadModel();
  }, []);

  const [activePages, setActivePages] = React.useState<SelectablePage[]>([]);
  const [selectablePageTitles, setSelectablePageTitles] = React.useState<string[]>([]);
  const [selectedPage, setSelectedPage] = React.useState<SelectablePage>();
  const [status, setStatus] = React.useState<SP_STATUS>("CREATING_GRAPH");
  const [mode, setMode] = React.useState<SP_MODE>(DEFAULT_MODE);

  const setTop100Titles = () => {
    setSelectablePageTitles(
      graph
        .filterNodes((title, attributes) => !isTitleOrUidDailyPage(title, attributes.uid))
        .sort((a, b) => graph.getNodeAttribute(b, "time") - graph.getNodeAttribute(a, "time"))
        .slice(0, 100)
    );
  };

  const setNonDailyTitles = () => {
    setSelectablePageTitles(
      graph.filterNodes((title, attributes) => !isTitleOrUidDailyPage(title, attributes.uid))
    );
  };

  const selectablePages = React.useMemo(
    () =>
      graph.filterNodes((node) => selectablePageTitles.includes(node)).map(nodeToSelectablePage),
    [selectablePageTitles]
  );

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
      // loading spinner to render before blocking main thread to load embeddings
      window.setTimeout(() => createGraph(), 100);
    }

    const createGraph = async () => {
      console.time("createGraph");

      const { pages, blocksWithRefs } = getPagesAndBlocksWithRefs();

      for (let i = 0; i < pages.length; i += 1) {
        addNodeToGraph(pages[i][0]);
      }

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

      // const activeNodes = graph.filterNodes((_, attributes) => attributes.active);

      // for (let i = 0; i < activeNodes.length; i += 1) {
      //   const node = activeNodes[i];
      //   let adamicAdarDistances: number[] = [];
      //   let shortestDirectedDistances: number[] = [];

      //   for (let j = 0; j < activeNodes.length; j += 1) {
      //     const otherNode = activeNodes[j];
      //     if (node != otherNode) {
      //       adamicAdarDistances.push(ademicAdarPoint(graph, node, otherNode));
      //       shortestDirectedDistances.push(shortestDirectedPathLength(graph, node, otherNode));
      //     }
      //   }

      //   console.log(
      //     "non infinity adamicAdarDistances",
      //     adamicAdarDistances.filter((d: number) => d !== Infinity)
      //   );

      //   console.log(
      //     "non infinity shortestDirectedDistances",
      //     shortestDirectedDistances.filter((d: number) => d != Infinity)
      //   );

      //   console.log("\n");

      //   // TODO update graph with the distances
      // }

      // for later:

      // const fullStrings = pages.map((p: any) => {
      //   return getStringAndChildrenString(p[0]);
      // });

      // console.log("PTNLOG - fullStrings", fullStrings);

      // const loadedModel = await model;
      // const embeddings = await loadedModel.embed(fullStrings.slice(0, 1000));
      // const embeddingValues = await embeddings.array();

      //   // LATER add paths-with-refs once I understand what they are
      //   // https://github.com/trashhalo/logseq-graph-analysis/commit/90250ad1785a7c46be0b5240383aca653f540859
      //   // https://discuss.logseq.com/t/what-are-path-refs/10413
      // });

      // const activeNodes = graph.filterNodes((n) => graph.getNodeAttribute(n, "active"));
      // setActivePages(activeNodes.map(nodeToSelectablePage));
      console.log("graph", graph);

      setNonDailyTitles();
      setStatus("READY");
      console.timeEnd("createGraph");
    };
  }, [graph, status]);

  React.useEffect(() => {
    mode === "neighbors" ? setNonDailyTitles() : setTop100Titles();
  }, [mode]);

  const renderLoading = status !== "READY";

  const updateSelectablePages = React.useCallback((pageList) => {
    console.log("updateGraphWithPagelist", pageList);
    setNewPagelist(pageList);
  }, []);

  return renderLoading ? (
    <Spinner></Spinner>
  ) : (
    <div className={gridStyles.container}>
      <div className={gridStyles.side}>
        <Card elevation={1}>
          <h5 className={styles.title}>selected page</h5>
          <PageSelect
            selectablePages={selectablePages}
            onPageSelect={(page) => {
              setSelectedPage(page);
            }}
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
