import MGRS from "../index.mjs";
import MATH from "../src/math.mjs";

const atan2d = {
  "with zero y and negative x": {
    "+0": [MATH.atan2d(0, -1), 180],
    "-0": [MATH.atan2d(-0, -1), -180],
  },
};

export default {
  atan2d: atan2d,
};
