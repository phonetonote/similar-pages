const CIRCLE_RESIZE_FACTOR = 3;
const BASE_R = 2;
const BRIGHT_BLUE = "#005AC2";
const ORANGE = "#FF6A1F";
const DARK_ORANGE = "#E0540D";

const circleExplainer = (isTop: boolean, isActive: boolean) => {
  const size = BASE_R + (isTop ? CIRCLE_RESIZE_FACTOR : 0);
  const opacity = isTop ? (isActive ? 0.95 : 0.8) : isActive ? 0.8 : 0.33;
  const stroke = isActive ? DARK_ORANGE : "transparent";
  const strokeWidth = isActive ? 3 : 0;
  const fill = isActive ? ORANGE : BRIGHT_BLUE;
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
