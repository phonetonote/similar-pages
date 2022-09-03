import { PAGE_KEYS, Page, BlockWithRefs } from "../types";

const pick = (obj: any, keys: any) =>
  Object.fromEntries(keys.filter((key: any) => key in obj).map((key: any) => [key, obj[key]]));

const getStringAndChildrenString = (node: any): any => {
  const newNode = { ...node };
  const newKeys = Object.keys(newNode);
  const hasString = newKeys.includes("string");
  const hasChildren = newKeys.includes("children");
  const hasTitle = newKeys.includes("title");

  if (!hasString && hasTitle) {
    newNode["string"] = newNode["title"];
  }

  newNode.string = newNode.string.replace(/\n/g, " ");

  if (hasChildren) {
    const combinedChildren = newNode.children
      .map((child: any) => getStringAndChildrenString(child))
      .map((child: any) => child.string)
      .join(". ");

    newNode.string += `. ${combinedChildren}`;
  }

  return pick(newNode, PAGE_KEYS);
};

const isUidDailyPage = (uid: string) => {
  return uid.match(/^\d{2}-\d{2}-\d{4}$/) !== null;
};

const getNonDailyPages = (roamAPI: Window["roamAlphaAPI"]): Page[] => {
  return roamAPI
    .q(
      "[ :find (pull ?e [ :node/title :edit/time :block/uid :block/string]) :where [?e :node/title]]"
    )
    .filter((page: [{ uid: string; title: string }]) => {
      if (page[0]["uid"] === undefined) {
        return false;
      } else {
        return !isUidDailyPage(page[0]["uid"]);
      }
    })
    .map((e: any[]) => getStringAndChildrenString(e[0]))
    .sort((a: { time: number }, b: { time: number }) => {
      return b.time - a.time;
    });
};

const getBlocksWithRefs = (roamAPI: Window["roamAlphaAPI"]): BlockWithRefs[] => {
  const blockWithRefs = roamAPI
    .q(`[:find (pull ?b  [* {:block/refs [*]} {:block/parents [*]}]) :where [?b :block/refs]]`)
    .map((arr) => arr[0]);

  return blockWithRefs;
};

export { getNonDailyPages, getBlocksWithRefs, isUidDailyPage };
