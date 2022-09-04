import React, { useMemo, useCallback } from "react";
import { RoamExtentionAPI } from "../types";
import { Button, Dialog, Classes, Icon } from "@blueprintjs/core";
import { useDebounceCallback } from "@react-hook/debounce";
import { SpBody } from "./sp-body";

const SPButton = ({ extensionAPI }: { extensionAPI: RoamExtentionAPI }) => {
  const [modalOpen, setModalOpen] = React.useState(true);

  const toggleModal = useCallback(() => {
    setModalOpen((modalOpen) => !modalOpen);
  }, [modalOpen]);
  return (
    <>
      <Button onClick={toggleModal} style={{ margin: "0 10px" }}>
        <Icon icon="scatter-plot"></Icon>
      </Button>
      <Dialog
        icon="scatter-plot"
        isOpen={modalOpen}
        onClose={toggleModal}
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
