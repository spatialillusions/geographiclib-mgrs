import MGRS from "../index.mjs";

/* Testing that we don't get a different MGRS back when we go back and fourth */
const mgrs = "42SUF1230045600";
const centerpoint = true;
const point = MGRS.toPoint(mgrs, centerpoint);

const accuracy = 5;
const result = MGRS.forward(point, accuracy);

export default {
  "MGRS to point and back": [mgrs, result],
};
