import React from "react";
import gridStyles from "../styles/grid.module.css";
import styles from "../styles/sp-body.module.css";
import {
  FULL_STRING_KEY,
  GraphablePage,
  NODE_ATTRIBUTES,
  PAGE_TITLE_KEY,
  SelectablePage,
  SHORTEST_PATH_KEY,
  SP_STATUS,
  TIME_KEY,
  TITLE_KEY,
  UID_KEY,
} from "../types";
import DebugObject from "./debug-object";
import { Spinner, Card } from "@blueprintjs/core";
import PageSelect from "./page/page-select";
import { BODY_SIZE, CHUNK_SIZE, MIN_NEIGHBORS } from "../constants";
import { initializeEmbeddingWorker } from "../services/embedding-worker-client";
import useGraph from "../hooks/useGraph";
import useSelectablePage from "../hooks/useSelectablePage";
import { getStringAndChildrenString } from "../services/queries";
import resolveRefs from "roamjs-components/dom/resolveRefs";
import { ShortestPathLengthMapping } from "graphology-shortest-path/unweighted";

export const SpBody = () => {
  const [pageMap, setPageMap] = React.useState(new Map<string, GraphablePage>());
  const [status, setStatus] = React.useState<SP_STATUS>("CREATING_GRAPH");
  const [selectedPageNode, setSelectedPageNode] = React.useState<NODE_ATTRIBUTES>();
  const [graph, initializeGraph, memoizedRoamPages] = useGraph();
  const [selectablePageNodes, setSelectablePageNodes, selectablePages] = useSelectablePage();

  React.useEffect(() => {
    window.setTimeout(() => {
      const initializeGraphAsync = async () => {
        await initializeGraph();
        const newPageNodes = new Map<string, NODE_ATTRIBUTES>();

        graph
          .filterNodes((node, _) => {
            const hasPaths = graph.hasNodeAttribute(node, SHORTEST_PATH_KEY);
            const hasNeighbors = graph.neighbors(node).length >= MIN_NEIGHBORS;

            return hasPaths && hasNeighbors;
          })
          .forEach((node) => {
            const {
              [TITLE_KEY]: title,
              [UID_KEY]: uid,
              [TIME_KEY]: time,
            } = memoizedRoamPages.get(node);

            newPageNodes.set(node, { title, uid, time });
          });

        setSelectablePageNodes(newPageNodes);
        setStatus("GRAPH_INITIALIZED");

        console.timeEnd("createGraph");
      };
      initializeGraphAsync();
    }, 10);
  }, []);

  React.useEffect(() => {
    if (selectedPageNode) {
      setStatus("GETTING_GRAPH_STATS");
      const apexRoamPage = memoizedRoamPages.get(selectedPageNode.uid);
      const apexStringAndChildrenString = getStringAndChildrenString(apexRoamPage);
      const apexFullBody = resolveRefs(apexStringAndChildrenString.slice(0, BODY_SIZE));

      setPageMap((prev) => {
        const newMap = new Map(prev);

        newMap.forEach((page, key) => {
          newMap.set(key, { ...page, status: "INACTIVE" });
        });

        return newMap;
      });

      setPageMap((prev) =>
        new Map(prev).set(selectedPageNode.uid, {
          status: "APEX",
          [FULL_STRING_KEY]: apexFullBody,
          [PAGE_TITLE_KEY]: apexRoamPage[TITLE_KEY],
        })
      );

      const singleSourceLengthMap: ShortestPathLengthMapping =
        graph.getNodeAttribute(selectedPageNode.uid, SHORTEST_PATH_KEY) || {};

      for (const [k, v] of Object.entries(singleSourceLengthMap)) {
        // LATER [[SP-01]]
        const roamPage = memoizedRoamPages.get(k);
        const stringAndChildrenString = getStringAndChildrenString(roamPage);

        setPageMap((prev) => {
          return new Map(prev).set(k, {
            status: "ACTIVE",
            dijkstraDiff: v,
            [PAGE_TITLE_KEY]: roamPage[TITLE_KEY],
            [FULL_STRING_KEY]:
              prev.get(k)?.[FULL_STRING_KEY] ||
              resolveRefs(stringAndChildrenString.slice(0, BODY_SIZE)),
          });
        });
      }

      setStatus("READY");
    }
  }, [selectedPageNode, setStatus, setPageMap, graph, memoizedRoamPages]);

  const pageSelectCallback = React.useCallback(
    ({ id, title }: SelectablePage) => {
      setSelectedPageNode({ uid: id, title: title, time: undefined });
    },
    [setSelectedPageNode]
  );

  React.useEffect(() => {
    if (status === "READY") {
      const activePageKeys = Array.from(pageMap).reduce((acc, [id, page]) => {
        if (page.status === "ACTIVE" && !page.embedding) {
          acc.push(id);
        }
        return acc;
      }, []);

      const chunkSize = CHUNK_SIZE;
      for (let i = 0; i < activePageKeys.length; i += chunkSize) {
        const chunkedPagesWithIds = activePageKeys.slice(i, i + chunkSize).map((k) => {
          const { [FULL_STRING_KEY]: fullString } = pageMap.get(k)!;
          return { id: k, fullString };
        });

        // we'll need to pass something into the worker to update 🔴 active pages
        initializeEmbeddingWorker(chunkedPagesWithIds).then((worker) => {
          // don't need to do anything with the worker
        });
      }
    }
  }, [pageMap, status]);

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
            {status === "GETTING_GRAPH_STATS" ? <Spinner></Spinner> : "ready for graph"}
            {/* <SpGraph graph={graph} activePages={activePages}></SpGraph> */}
          </div>
        </div>
        <DebugObject obj={graph.inspect()} />
        <DebugObject obj={selectablePageNodes.size} />
      </div>
    </div>
  );
};
