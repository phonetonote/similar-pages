import { ACTIVE_QUERIES, BODY_SIZE } from "../constants";
import { CHILDREN_KEY, IncomingNode, PPage, STRING_KEY, TITLE_KEY } from "../types";

const getStringAndChildrenString = (incomingNode: IncomingNode): any => {
  const strings: string[] = [incomingNode[TITLE_KEY]];
  const queue = [incomingNode];
  let lengthCount = 0;

  while (lengthCount < BODY_SIZE && queue.length > 0) {
    const node = queue.shift();

    if (node[STRING_KEY]) {
      strings.push(node[STRING_KEY]);
      lengthCount += node?.[STRING_KEY]?.length ?? 0;
    }

    if (lengthCount < BODY_SIZE && node[CHILDREN_KEY]) {
      queue.push(...node[CHILDREN_KEY]);
    }
  }

  return strings.join(" ");
};

const isUidDailyPage = (uid: string) => {
  return uid.match(/^\d{2}-\d{2}-\d{4}$/) !== null;
};

const getPagesAndBlocksWithRefs = () => {
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

  const blocksWithRefs: any = window.roamAlphaAPI.data.fast.q(
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
  );

  return { pages, blocksWithRefs };
};

export { getStringAndChildrenString, isUidDailyPage, getPagesAndBlocksWithRefs };
