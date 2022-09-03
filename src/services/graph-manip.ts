// Credit to Stephen Solka, creator of logseq-graph-analysis
// https://github.com/trashhalo/logseq-graph-analysis

import { BlockWithRefs, RichRef, TargetSource } from "../types";
// import getBlockUidsReferencingBlock from "roamjs-components/queries/getBlockUidsReferencingBlock";
import getPageUidByBlockUid from "roamjs-components/queries/getPageUidByBlockUid";
import { isUidDailyPage } from "./queries";

function blockToReferences(block: BlockWithRefs): TargetSource[] {
  const { refs } = block;
  const sourceUid = getPageUidByBlockUid(block.uid);

  if (!sourceUid || isUidDailyPage(sourceUid)) {
    return [];
  } else {
    // TODO add paths-with-refs once I understand what they are
    // https://github.com/trashhalo/logseq-graph-analysis/commit/90250ad1785a7c46be0b5240383aca653f540859
    // https://discuss.logseq.com/t/what-are-path-refs/10413

    return refs
      .filter((ref) => !isUidDailyPage(ref.uid))
      .map((ref) => ({
        source: sourceUid,
        target: ref.uid,
      }));
  }
}

export { blockToReferences };
