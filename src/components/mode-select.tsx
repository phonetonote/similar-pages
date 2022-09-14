import React from "react";
import { ButtonGroup, Button } from "@blueprintjs/core";
import { SP_MODE } from "../types";
import { DEFAULT_MODE } from "../constants";

const modeSelect = ({ mode, setMode }: { mode: SP_MODE; setMode: (mode: SP_MODE) => void }) => {
  const setNeighborMode = React.useCallback(() => {
    setMode("neighbors");
  }, []);

  const setQueriesMode = React.useCallback(() => {
    setMode("queries");
  }, []);

  return (
    // TODO add tooltips
    <ButtonGroup>
      <Button
        icon="layout-auto"
        text="neighbors"
        onClick={setNeighborMode}
        active={mode === "neighbors"}
      />
      <Button
        icon="heat-grid"
        text="queries"
        onClick={setQueriesMode}
        active={mode === "queries"}
      />
    </ButtonGroup>
  );
};

export default modeSelect;
