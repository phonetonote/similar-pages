import React, { useCallback } from "react";
import { Button, Dialog, Classes, Icon } from "@blueprintjs/core";
import { SpBody } from "./sp-body";

const SPButton = () => {
  const [modalOpen, setModalOpen] = React.useState(true);

  const openModal = useCallback(() => {
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

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
        style={{ width: "95%", maxWidth: "none", paddingBottom: 0, minHeight: "95vh" }}
      >
        <div className={Classes.DIALOG_BODY}>
          <SpBody></SpBody>
        </div>
      </Dialog>
    </>
  );
};

export default SPButton;
