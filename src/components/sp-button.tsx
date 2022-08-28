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
      <Dialog icon="scatter-plot" isOpen={modalOpen} onClose={toggleModal} title="similar pages">
        <div className={Classes.DIALOG_BODY}>
          <SpBody></SpBody>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          {/* #TODO remove or use this footer */}
          {/* <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={toggleModal}>Close</Button>
          </div> */}
        </div>
      </Dialog>
    </>
  );
};

export default SPButton;
