const CIRCLE_RESIZE_FACTOR = 3;
const BASE_R = 2;

const circleExplainer = (isTop: boolean, isActive: boolean) => {
  const size = BASE_R + (isTop ? CIRCLE_RESIZE_FACTOR : 0);
  const opacity = isTop ? (isActive ? 0.95 : 0.8) : isActive ? 0.8 : 0.33;
  const stroke = isActive ? "#E0540D" : "transparent";
  const strokeWidth = isActive ? 3 : 0;
  const fill = isActive ? "#FF6A1F" : "#005AC2";
  const z = isActive ? 2 : 1;

  return {
    size,
    opacity,
    stroke,
    strokeWidth,
    fill,
    z,
  };
};

export { circleExplainer };
