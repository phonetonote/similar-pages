import gridStyles from "../styles/grid.module.css";
import styles from "../styles/sp-body.module.css";
import {
  EmbeddablePageOutput,
  IncomingNode,
  NEIGHBOR_MAP,
  NODE_ATTRIBUTES,
  ResultWithTitle,
  SelectablePage,
  SelectablePageList,
  SHORTEST_PATH_KEY,
  SP_MODE,
  SP_STATUS,
  TITLE_KEY,
} from "../types";
import DebugObject from "./debug-object";
import { Spinner, Card, ProgressBar } from "@blueprintjs/core";
import PageSelect from "./page/page-select";
import { CHUNK_SIZE, DEFAULT_MODE, LAST_100_PAGES } from "../constants";
import { initializeEmbeddingWorker } from "../services/embedding-worker-client";
import useGraph from "../hooks/useGraph";
import { ShortestPathLengthMapping } from "graphology-shortest-path/unweighted";
import usePageMap from "../hooks/usePageMap";
import React from "react";
import { Result } from "roamjs-components/types/query-builder";
import { getNeighborMap, ademicAdar } from "../services/graph-manip";
import { getStringAndChildrenString } from "../services/queries";

export const SpBody = () => {
  const [
    upsertApexAttrs,
    upsertActiveAttrs,
    addEmbeddings,
    addSimilarities,
    pageKeysToEmbed,
    embeddingMap,
    fullStringMap,
    dijkstraDiffMap,
    similarityMap,
    titleMap,
    hasAllEmbeddings,
  ] = usePageMap();
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

  const selectablePages = React.useMemo(() => {
    return graph
      .filterNodes((node) => selectablePageTitles.includes(node))
      .map(nodeToSelectablePage);
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
  }, [graph, initializeGraph]);

  React.useEffect(() => {
    if (selectedPage) {
      setStatus("GETTING_GRAPH_STATS");

      const apexRoamPage = roamPages.get(selectedPage.uid);
      const singleSourceLengthMap: ShortestPathLengthMapping =
        graph.getNodeAttribute(selectedPage.uid, SHORTEST_PATH_KEY) || {};

      upsertApexAttrs(selectedPage.uid, apexRoamPage);
      upsertActiveAttrs(singleSourceLengthMap, roamPages);
      setStatus("READY_TO_EMBED");
    }
  }, [
    selectedPage,
    setStatus,
    upsertApexAttrs,
    upsertActiveAttrs,
    graph,
    roamPages,
  ]);

  const pageSelectCallback = React.useCallback(
    ({ id, title }: SelectablePage) => {
      setSelectedPage({ uid: id, title: title, time: undefined });
    },
    [setSelectedPage]
  );

  // probably need to calculate the distance in the worker and not return the embeddings, too much data
  const addEmbeddingsToActivePageMap = React.useCallback(
    (embeddablePageOutputs: EmbeddablePageOutput[]) => {
      console.log("embeddablePageOutputs", embeddablePageOutputs[0]["id"]);
      console.time("addEmbeddings");
      setStatus("SYNCING_EMBEDS");
      setLoadingIncrement((prev) => prev + (1 - prev) / 2); // 🔖 comment out the other lines here
      addEmbeddings(embeddablePageOutputs);
      console.timeEnd("addEmbeddings");
      console.log("--------------------------\n");
    },
    [addEmbeddings]
  );

  React.useEffect(() => {
    // 🔖 TODO hasAllEmbeddings seems a bit slow
    if (status === "SYNCING_EMBEDS" && hasAllEmbeddings) {
      addSimilarities(embeddingMap);
      setStatus("READY_TO_DISPLAY");
    } else if (status === "READY_TO_EMBED") {
      const initializeEmbeddingsAsync = async () => {
        setLoadingIncrement(0.35);

        if (pageKeysToEmbed.length > 0) {
          for (let i = 0; i < pageKeysToEmbed.length; i += CHUNK_SIZE) {
            const chunkedPagesWithIds = pageKeysToEmbed.slice(i, i + CHUNK_SIZE).map((id) => {
              return { id, fullString: fullStringMap.get(id) };
            });

  const getGraphStats = async (page: SelectablePage) => {
    setSelectedPage(page);
    const neighborMap: NEIGHBOR_MAP = getNeighborMap(graph);
    const scores = ademicAdar(graph, neighborMap, page.title);
    const activePageTitles = [];
    for (var [pageTitle, data] of Object.entries(scores)) {
      if (data.measure < Infinity) {
        // should we be updating a local state type thing here instead of the graph?
        // LATER add other metric options
        graph.updateNodeAttribute(pageTitle, "adamicAdar", () => data.measure);
        graph.updateNodeAttribute(pageTitle, "active", () => true);
        activePageTitles.push(pageTitle);
      }
    }

    const activeNodes = activePageTitles.map((pageTitle) => pages.get(pageTitle)) as IncomingNode[];

    const fullStringMap: Map<string, string> = new Map();
    activeNodes.forEach((node) => {
      fullStringMap.set(node[TITLE_KEY], getStringAndChildrenString(node));
    });

    const loadedModel = await model;
    const embeddings = await loadedModel.embed([...fullStringMap.values()]);
    const embeddingValues = await embeddings.array();

    console.log("embeddingValues", embeddingValues);
    // 🔖 need to fix loading issue by running initial graph calculations before loading is done
  };

  const pageSelectCallback = React.useCallback((page: SelectablePage) => {
    console.log("pageSelectCallback", page);
    if (page) {
      getGraphStats(page);
    }
  }, []);

  return status === "CREATING_GRAPH" ? (
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
            {status === "GRAPH_INITIALIZED" ? (
              "Select a page to get started"
            ) : status === "READY_TO_DISPLAY" ? (
              "Time to graph"
            ) : (
              <>
                <Spinner></Spinner>
                <ProgressBar value={loadingIncrement}></ProgressBar>
              </>
            )}
            {/* <SpGraph graph={graph} activePages={activePages}></SpGraph> */}
          </div>
        </div>
        <DebugObject obj={graph.inspect()} />
      </div>
    </div>
  );
};
