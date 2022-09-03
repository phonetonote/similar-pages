import React from "react";

function debugObject(props: { obj: any }): JSX.Element {
  const { obj } = props;

  return <pre>${obj && JSON.stringify(obj.inspect()).substring(0, 1000)}</pre>;
}

export default React.memo(debugObject);
