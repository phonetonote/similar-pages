import React, { useCallback } from "react";
import { Button, Dialog, Classes, Icon } from "@blueprintjs/core";
import { SpBody } from "./sp-body";
import styles from "../styles/sp-button.module.css";

const SPButton = () => {
  const [modalOpen, setModalOpen] = React.useState(false);

  const openModal = useCallback(() => {
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  return (
    <>
      <Button
        onClick={openModal}
        style={{ margin: "0 0 0 10px" }}
        className="bp3-button bp3-minimal bp3-small"
      >
        <Icon icon="scatter-plot"></Icon>
      </Button>
      <Dialog
        icon="scatter-plot"
        isOpen={modalOpen}
        onClose={closeModal}
        title="similar pages"
        style={{ width: "95%", maxWidth: "none", paddingBottom: 0, minHeight: "90vh" }}
      >
        <div className={`${Classes.DIALOG_BODY} ${styles.graphbodywrap} `}>
          <SpBody></SpBody>
        </div>
      </Dialog>
    </>
  );
};

export default SPButton;
