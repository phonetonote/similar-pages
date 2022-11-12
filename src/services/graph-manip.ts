import {
  NODE_ATTRIBUTES,
  PPage,
  TITLE_KEY,
  UID_KEY,
  TIME_KEY,
  PointWithTitleAndId,
} from "../types";

const nodeArrToSelectablePage = ([uid, { title }]: [string, NODE_ATTRIBUTES]) => {
  return { title, id: uid, icon: "document" };
};

const pageToNode = (page: PPage): NODE_ATTRIBUTES => {
  return {
    title: page[TITLE_KEY],
    uid: page[UID_KEY],
    time: page[TIME_KEY],
  };
};

const isTitleOrUidDailyPage = (title: string, uid: string) => {
  return (
    /\d{2}-\d{2}-\d{4}/.test(uid) ||
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s[0-9]+(st|th|rd),\s([0-9]){4}/.test(
      title
    )
  );
};

const isRelevantPage = (title: string, uid: string): boolean => {
  return !isTitleOrUidDailyPage(title, uid) && title !== "DONE";
};

const linkPagesAsync = async (pagentPage: PointWithTitleAndId, linkedPageTitle: string) => {
  await window.roamAlphaAPI.createBlock({
    location: { "parent-uid": pagentPage.uid, order: 0 },
    block: {
      string: `on [[${window.roamAlphaAPI.util.dateToPageTitle(
        new Date()
      )}]] you used [[Similar Pages extension]] to link ${
        pagentPage.title
      } to [[${linkedPageTitle}]]`,
    },
  });
};

export { nodeArrToSelectablePage, pageToNode, isRelevantPage, linkPagesAsync };
