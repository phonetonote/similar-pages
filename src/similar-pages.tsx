import React from "react";
import ReactDOM from "react-dom";
import SPButton from "./components/sp-button";
import { ROOT_ID } from "./constants";

export default {
  onload: () => {
    const container = document.getElementsByClassName("rm-topbar")[0];
    const root = document.createElement("div");
    root.id = `${ROOT_ID}`;

    const searchBox = container.getElementsByClassName("rm-find-or-create-wrapper")[0];
    searchBox.insertAdjacentElement("afterend", root);

    ReactDOM.render(
      <>
        <SPButton />
      </>,
      root
    );
  },
  onunload: () => {
    const root = document.getElementById(ROOT_ID);
    ReactDOM.unmountComponentAtNode(root);
    root.remove();
  },
};
