import { BODY_SIZE } from "../constants";
import { Children, CHILDREN_KEY, IncomingNode, PPage, PRef, STRING_KEY, TITLE_KEY } from "../types";

const getStringAndChildrenString = (incomingNode: IncomingNode | Children): any => {
  const strings: string[] = [incomingNode?.[TITLE_KEY] || ""];
  const queue = [incomingNode];
  let lengthCount = strings[0].length;

  while (lengthCount < BODY_SIZE && queue.length > 0) {
    const node = queue.shift();

    if (node?.[STRING_KEY]) {
      lengthCount += node?.[STRING_KEY]?.length ?? 0;

      if (lengthCount < BODY_SIZE) {
        strings.push(node[STRING_KEY]);
      }
    }

    if (lengthCount < BODY_SIZE && node?.[CHILDREN_KEY]) {
      queue.push(...node[CHILDREN_KEY]);
    }
  }

  return strings.join(" ");
};

const getPagesAndBlocksWithRefs = (): {
  pages: Map<string, IncomingNode>;
  blocksWithRefs: [PRef][];
} => {
  const results: { [TITLE_KEY]: string }[][] = window.roamAlphaAPI.data.fast.q(
    `[:find (pull ?p [:node/title :block/uid]) :where [?b :block/refs ?p] [?b :block/string ?s] [?p :node/title ?t] [(str ?t "::") ?a] [(clojure.string/starts-with? ?s ?a)]]`
  ) as { [TITLE_KEY]: string }[][];

  const attributePageTitles = results.map(
    (p: { [TITLE_KEY]: string }[]) => p[0][TITLE_KEY]
  ) as string[];

  console.log("attributePages", attributePageTitles);

  const pageMap = new Map<string, IncomingNode>();
  const pages: [PPage][] = window.roamAlphaAPI.data.fast.q(`
    [ :find (pull ?e
        [
          :node/title
          :edit/time
          :block/uid
          :block/string
          :block/children
            {:block/children ...}
        ]
      ) :where [?e :node/title]
    ]
  `) as [PPage][];

  pages.forEach((pPageArr) => {
    const pageTitle = pPageArr[0][TITLE_KEY];

    if (!attributePageTitles.includes(pageTitle)) {
      pageMap.set(pPageArr[0][TITLE_KEY], pPageArr[0]);
    }
  });

  const blocksWithRefs: [PRef][] = window.roamAlphaAPI.data.fast.q(
    `
    [ :find (pull ?e
        [
          :node/title
          :block/uid
          :block/refs
          {:block/refs ...}
          :block/page
           {:block/page ...}
        ]
      ) :where [?e :block/refs]
    ]
  `
  ) as [PRef][];

  return { pages: pageMap, blocksWithRefs };
};

export { getStringAndChildrenString, getPagesAndBlocksWithRefs };
