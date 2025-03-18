import MGRS from "../index.mjs";
import UTMUPS from "../src/utmups.mjs";

const zero = MGRS.forward([3, 0], 2);
//console.log("31NEA0000");

const negativeZero = MGRS.forward([3, -0], 2);
//console.log("31MEV0099");

export default {
  "Testing for lat 0 vs -0": {
    Zero: [zero, "31NEA0000"],
    "Negative Zero": [negativeZero, "31MEV0099"],
  },
};
