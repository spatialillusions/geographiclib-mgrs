import MGRS from "../index.mjs";

/* TODO TODO TODO 
Verify output against proj4js mgrs
 */

let result;
let inverse = {};

let mgrs = "42SUF1230045600";
result = MGRS.inverse(mgrs);
inverse[mgrs] = [
  result,
  [
    66.90321654622385, 36.537382825721096, 66.90322746704089,
    36.537392031170896,
  ],
];

mgrs = "42SUF123456";
result = MGRS.inverse(mgrs);
inverse[mgrs] = [
  result,
  [66.90321654622385, 36.537382825721096, 66.9043086407328, 36.538303366092265],
];

export default {
  "MGRS inverse": inverse,
};
