import React from "react";
import gridStyles from "../styles/grid.module.css";
import styles from "../styles/sp-body.module.css";
import * as tf from "@tensorflow/tfjs-core";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import "@tensorflow/tfjs-backend-webgl";
import { getNonDailyPages, getBlocksWithRefs } from "../services/queries";
import { BlockWithRefs, SelectablePage, SelectablePageList } from "../types";
import Graph from "graphology";
import { blockToReferences } from "../services/graph-manip";
import DebugObject from "./debug-object";
import { LAST_100_PAGES, SELECTABLE_PAGE_LISTS, USE_LOADING_TIME } from "../constants";
import { Spinner, SpinnerSize, ProgressBar, Card, IconName } from "@blueprintjs/core";
import PageListSelect from "./page-list/page-list-select";
import PageSelect from "./page/page-select";

// this implies we only want to fetch this once
const nonDailyPages = getNonDailyPages(window.roamAlphaAPI);

export const SpBody = () => {
  const graph = React.useMemo(() => {
    return new Graph();
  }, []);

  const nodeToSelectablePage = (n: string) => ({
    title: graph.getNodeAttribute(n, "title"),
    id: graph.getNodeAttribute(n, "uid"),
    icon: "document" as IconName,
  });

  const [activePages, setActivePages] = React.useState<SelectablePage[]>([]);
  const [selectedPage, setSelectedPage] = React.useState<SelectablePage>();
  const [loadingPercentage, setLoadingPercentage] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const updateGraph = async (newPageList: SelectablePageList) => {
    activePages.forEach((page) => {
      graph.updateNodeAttribute(page.id, "active", () => false);
    });

    if (newPageList.id === LAST_100_PAGES.id) {
      nonDailyPages.slice(0, 100).forEach((p, i) => {
        graph.updateNodeAttribute(p.uid, "active", () => true);
      });
    } else if (newPageList.icon === SELECTABLE_PAGE_LISTS[SELECTABLE_PAGE_LISTS.length - 1].icon) {
      const pagesFromQuery = await window.roamjs.extension.queryBuilder.runQuery(newPageList.id);

      pagesFromQuery.forEach((p) => {
        if (graph.hasNode(p.uid)) {
          graph.updateNodeAttribute(p.uid, "active", () => true);
        }
      });
    }
    setActivePages(
      graph
        .nodes()
        .filter((n) => graph.getNodeAttribute(n, "active"))
        .map(nodeToSelectablePage)
    );
  };

  React.useEffect(() => {
    const loadEmbeddings = async () => {
      console.time("loadEmbeddings");
      tf.setBackend("webgl");

      const blocksWithRefs: BlockWithRefs[] = await getBlocksWithRefs(window.roamAlphaAPI);
      const loadingDenom = USE_LOADING_TIME + nonDailyPages.length + blocksWithRefs.length;
      const model = await use.load();
      setLoadingPercentage(USE_LOADING_TIME / loadingDenom);

      const embeddings = await model.embed(nonDailyPages.map((p) => p.string));
      const embeddingsArr = await embeddings.array();
      setLoadingPercentage((USE_LOADING_TIME + nonDailyPages.length) / loadingDenom);

      nonDailyPages.forEach((p, i) => {
        graph.addNode(p.uid, {
          ...p,
          embedding: embeddingsArr[i],
          i: i,
          active: i < 100,
        });

        setLoadingPercentage(i / loadingDenom);
      });

      for (const [i, blockWithRefs] of blocksWithRefs.entries()) {
        const blockTargetSources = blockToReferences(blockWithRefs);

        if (blockTargetSources && blockTargetSources.length > 0) {
          for (const blockTargetSource of blockTargetSources) {
            const { target, source } = blockTargetSource;

            if (graph.hasNode(source) && graph.hasNode(target)) {
              if (!graph.hasEdge(source, target)) {
                graph.addEdge(source, target, { weight: 1 });
              } else {
                graph.updateDirectedEdgeAttribute(source, target, "weight", (weight) => weight + 1);
              }
            }
          }
        }

        setLoadingPercentage((i + nonDailyPages.length) / loadingDenom);
      }

      const activeNodes = graph.filterNodes((n) => graph.getNodeAttribute(n, "active"));
      setActivePages(activeNodes.map(nodeToSelectablePage));

      setLoading(false);
      console.timeEnd("loadEmbeddings");
    };

    if (graph && graph.size === 0) {
      loadEmbeddings();
    }
  }, [graph]);

  return (
    <div className={gridStyles.container}>
      <div className={gridStyles.side}>
        {loading ? (
          <ProgressBar value={loadingPercentage}></ProgressBar>
        ) : (
          [
            <Card elevation={1}>
              <h5 className={styles.title}>selected page</h5>
              <PageSelect
                selectablePages={activePages}
                onPageSelect={(page) => {
                  setSelectedPage(page);
                }}
              ></PageSelect>
            </Card>,
            <Card elevation={1}>
              <h5 className={styles.title}>page list</h5>
              <PageListSelect
                onPageListSelect={(pageList) => updateGraph(pageList)}
              ></PageListSelect>
            </Card>,
          ]
        )}
      </div>
      <div className={gridStyles.body}>
        {loading ? (
          <Spinner size={SpinnerSize.LARGE} value={loadingPercentage}></Spinner>
        ) : (
          <>
            <DebugObject obj={graph} />
            <DebugObject obj={selectedPage} />
          </>
        )}
      </div>
    </div>
  );
};
