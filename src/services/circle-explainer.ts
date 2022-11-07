const CIRCLE_RESIZE_FACTOR = 3;
const BASE_R = 2;

const circleExplainer = (isTop: boolean, isActive: boolean) => {
  const size = BASE_R + (isTop ? CIRCLE_RESIZE_FACTOR : 0);
  const opacity = isTop ? 1 : 0.5;
  const stroke = isActive ? "#00079c" : "transparent";
  const strokeWidth = isActive ? 3 : 0;
  const fill = isActive ? "#00ff4e" : "#f6c431";

  return {
    size,
    opacity,
    stroke,
    strokeWidth,
    fill,
  };
};

export { circleExplainer };
