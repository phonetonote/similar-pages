import React from "react";

const tooltipMessageGenerator = (
  titleA: string,
  titleB: string,
  areNeighbors: boolean
): JSX.Element => {
  return (
    <p>
      {areNeighbors ? (
        <>
          [[{titleA}]] and [[{titleB}]] are already neighbors.
        </>
      ) : (
        <>
          create a link between [[<strong>{titleA}</strong>]] and [[
          <strong>{titleB}</strong>]]?
        </>
      )}
    </p>
  );
};

export { tooltipMessageGenerator };
