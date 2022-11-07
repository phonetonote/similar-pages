import React from "react";

type SpVoronoiControlsProps = {
  showVoronoi: boolean;
  setShowVoronoi: (showVoronoi: boolean) => void;
};

const SpVoronoiControls = ({ showVoronoi, setShowVoronoi }: SpVoronoiControlsProps) => {
  return (
    <div>
      <label style={{ fontSize: 12 }}>
        <input
          type="checkbox"
          checked={showVoronoi}
          onChange={() => setShowVoronoi(!showVoronoi)}
        />
        &nbsp;Show voronoi point map
      </label>
    </div>
  );
};

export { SpVoronoiControls };
