import React, { useMemo, useCallback } from "react";
import { RoamExtentionAPI, SP_STATUS } from "../types";
import { Button, Dialog, Classes, Icon } from "@blueprintjs/core";
import { useDebounceCallback } from "@react-hook/debounce";
import { SpBody } from "./sp-body";

const SPButton = ({ extensionAPI }: { extensionAPI: RoamExtentionAPI }) => {
  const [modalOpen, setModalOpen] = React.useState(true);

  const openModal = useCallback(() => {
    console.log("openModal");
    setModalOpen(true);
  }, [modalOpen]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, [modalOpen]);

  return (
    <>
      <Button onClick={openModal} style={{ margin: "0 10px" }}>
        <Icon icon="scatter-plot"></Icon>
      </Button>
      <Dialog
        icon="scatter-plot"
        isOpen={modalOpen}
        onClose={closeModal}
        title="similar pages"
        style={{ width: "95%", maxWidth: "none", paddingBottom: 0 }}
      >
        <div className={Classes.DIALOG_BODY}>
          <SpBody></SpBody>
        </div>
      </Dialog>
    </>
  );
};

export default SPButton;
