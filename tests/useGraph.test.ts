import { renderHook } from "@testing-library/react-hooks";
import useGraph from "../src/hooks/useGraph";
import { IncomingNode, PPAGE_KEY, REF_KEY, TIME_KEY, TITLE_KEY, UID_KEY } from "../src/types";

test("initializes the graph with relevant pages", async () => {
  const fakePages = new Map();
  const fakePageTitles = ["page1", "page2"];
  const irrelevantPageTitle = "DONE";
  const fakeUids = ["123", "456"];
  const fakeTimes = [1, 2];
  const orphanPageTitle = "orphan";

  const fakePageNode1: IncomingNode = {
    [TITLE_KEY]: fakePageTitles[0],
    [UID_KEY]: fakeUids[0],
    [TIME_KEY]: fakeTimes[0],
  };

  const fakePageNode2: IncomingNode = {
    [TITLE_KEY]: fakePageTitles[1],
    [UID_KEY]: fakeUids[1],
    [TIME_KEY]: fakeTimes[1],
  };

  const irrelevantPageNode: IncomingNode = {
    [TITLE_KEY]: irrelevantPageTitle,
    [UID_KEY]: "456",
    [TIME_KEY]: 2,
  };

  const orphanUid = "29839283";
  const orphanPageNode: IncomingNode = {
    [TITLE_KEY]: orphanPageTitle,
    [UID_KEY]: orphanUid,
    [TIME_KEY]: 23,
  };

  fakePages.set(fakePageTitles[0], fakePageNode1);
  fakePages.set(fakePageTitles[1], fakePageNode2);
  fakePages.set(irrelevantPageTitle, irrelevantPageNode);
  fakePages.set(orphanPageTitle, orphanPageNode);

  const { result } = renderHook(() =>
    useGraph(() => {
      return {
        pages: fakePages,
        blocksWithRefs: [
          [
            {
              [UID_KEY]: "789",
              [REF_KEY]: [
                {
                  [UID_KEY]: fakeUids[0],
                  [TITLE_KEY]: fakePageTitles[0],
                  [TIME_KEY]: 4,
                },
              ],
              [PPAGE_KEY]: {
                [TITLE_KEY]: fakePageTitles[1],
                [TIME_KEY]: 3,
                [UID_KEY]: fakeUids[1],
              },
            },
          ],
          // this one uses a block ref and goes in the other direction
          [
            {
              [UID_KEY]: "789",
              [REF_KEY]: [
                {
                  [UID_KEY]: "7",
                  [PPAGE_KEY]: {
                    [TITLE_KEY]: fakePageTitles[1],
                    [TIME_KEY]: 5,
                    [UID_KEY]: fakeUids[1],
                  },
                  [TIME_KEY]: 5,
                },
              ],
              [PPAGE_KEY]: {
                [TITLE_KEY]: fakePageTitles[0],
                [TIME_KEY]: 3,
                [UID_KEY]: fakeUids[0],
              },
            },
          ],
        ],
      };
    })
  );

  const [graph, initializeGraph, memoizedRoamPages] = result.current;
  initializeGraph(1);

  expect(graph.nodes().length).toBe(fakePageTitles.concat(orphanPageTitle).length);
  expect(graph.edges().length).toBe(2);

  expect(Array.from(memoizedRoamPages).map((arr) => arr[0])).toEqual(
    fakePageTitles.concat(irrelevantPageTitle).concat(orphanPageTitle)
  );

  expect(Object.keys(graph.getNodeAttributes(fakeUids[0]).shortestPathMap)).toEqual(fakeUids);

  expect(Object.keys(graph.getNodeAttributes(orphanUid).shortestPathMap)).toEqual([orphanUid]);
});
