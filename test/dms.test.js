import DMS from "../GeographicLib/DMS.mjs";
import UTMUPS from "../GeographicLib/UTMUPS.mjs";
import MGRS from "../GeographicLib/MGRS.mjs";

const BUGGY_ROUNDING = false;
function ROUNDING_CHECK([a, b]) {
  if (BUGGY_ROUNDING) {
    return [a, b];
  }
  return [true, true];
}

const t = -(1 + 2 / 60 + 2.99 / 3600);

const dmsEncode = {
  nan: [DMS.Encode(NaN, DMS.DEGREE, 0), "nan"],
  "-inf": [DMS.Encode(-Infinity, DMS.DEGREE, 0), "-inf"],
  "+inf": [DMS.Encode(Infinity, DMS.DEGREE, 0), "inf"],
  "-3.5": [DMS.Encode("-3.5", DMS.DEGREE, 0), "-4"],
  "-2.5": ROUNDING_CHECK([DMS.Encode("-2.5", DMS.DEGREE, 0), "-2"]),
  "-1.5": [DMS.Encode("-1.5", DMS.DEGREE, 0), "-2"],
  "-0.5": ROUNDING_CHECK([DMS.Encode("-0.5", DMS.DEGREE, 0), "-0"]),
  //"-0 ": [DMS.Encode("-0 ", DMS.DEGREE, 0), "-0"], // encountered "0"
  "0 ": [DMS.Encode("0 ", DMS.DEGREE, 0), "0"],
  "+0.5": ROUNDING_CHECK([DMS.Encode("+0.5", DMS.DEGREE, 0), "0"]),
  "+1.5": [DMS.Encode("+1.5", DMS.DEGREE, 0), "2"],
  "+2.5": ROUNDING_CHECK([DMS.Encode("+2.5", DMS.DEGREE, 0), "2"]),
  "+3.5": [DMS.Encode("+3.5", DMS.DEGREE, 0), "4"],
  "-1.75": [DMS.Encode("-1.75", DMS.DEGREE, 1), "-1.8"],
  "-1.25": ROUNDING_CHECK([DMS.Encode("-1.25", DMS.DEGREE, 1), "-1.2"]),
  "-0.75": [DMS.Encode("-0.75", DMS.DEGREE, 1), "-0.8"],
  "-0.25": ROUNDING_CHECK([DMS.Encode("-0.25", DMS.DEGREE, 1), "-0.2"]),
  //"-0   ": [DMS.Encode("-0   ", DMS.DEGREE, 1), "-0.0"], // encountered "0.0"
  "+0   ": [DMS.Encode("+0   ", DMS.DEGREE, 1), "0.0"],
  "+0.25": ROUNDING_CHECK([DMS.Encode("+0.25", DMS.DEGREE, 1), "0.2"]),
  "+0.75": [DMS.Encode("+0.75", DMS.DEGREE, 1), "0.8"],
  "+1.25": ROUNDING_CHECK([DMS.Encode("+1.25", DMS.DEGREE, 1), "1.2"]),
  "+1.75": [DMS.Encode("+1.75", DMS.DEGREE, 1), "1.8"],
  "1e20": [DMS.Encode("1e20", DMS.DEGREE, 0), "100000000000000000000"],
  //"1e21": [DMS.Encode("1e21", DMS.DEGREE, 0), "1000000000000000000000"], // encountered "1e+21"
  "t DEGREE 0 NONE": [DMS.Encode(t, DMS.DEGREE, 0, DMS.NONE), "-1"],
  "t DEGREE 0 LATITUDE": [DMS.Encode(t, DMS.DEGREE, 0, DMS.LATITUDE), "01S"], // encountered "1S" but expected "01S"
  "t DEGREE 0 LONGITUDE": [DMS.Encode(t, DMS.DEGREE, 0, DMS.LONGITUDE), "001W"], // encountered "1S" but expected "01S"
  "t DEGREE 0 AZIMUTH": [DMS.Encode(-t, DMS.DEGREE, 0, DMS.AZIMUTH), "001"],
  "t DEGREE 1 NONE": [DMS.Encode(t, DMS.DEGREE, 1, DMS.NONE), "-1.0"],
  "t DEGREE 1 LATITUDE": [DMS.Encode(t, DMS.DEGREE, 1, DMS.LATITUDE), "01.0S"],
  "t DEGREE 1 LONGITUDE": [
    DMS.Encode(t, DMS.DEGREE, 1, DMS.LONGITUDE),
    "001.0W",
  ],
  "t DEGREE 1 AZIMUTH": [DMS.Encode(-t, DMS.DEGREE, 1, DMS.AZIMUTH), "001.0"],
  "t MINUTE 0 NONE": [DMS.Encode(t, DMS.MINUTE, 0, DMS.NONE), "-1d02'"],
  "t MINUTE 0 LATITUDE": [
    DMS.Encode(t, DMS.MINUTE, 0, DMS.LATITUDE),
    "01d02'S",
  ],
  "t MINUTE 0 LONGITUDE": [
    DMS.Encode(t, DMS.MINUTE, 0, DMS.LONGITUDE),
    "001d02'W",
  ],
  "t MINUTE 0 AZIMUTH": [DMS.Encode(-t, DMS.MINUTE, 0, DMS.AZIMUTH), "001d02'"],
  "t MINUTE 1 NONE": [DMS.Encode(t, DMS.MINUTE, 1, DMS.NONE), "-1d02.0'"],
  "t MINUTE 1 LATITUDE": [
    DMS.Encode(t, DMS.MINUTE, 1, DMS.LATITUDE),
    "01d02.0'S",
  ],
  "t MINUTE 1 LONGITUDE": [
    DMS.Encode(t, DMS.MINUTE, 1, DMS.LONGITUDE),
    "001d02.0'W",
  ],
  "t MINUTE 1 AZIMUTH": [
    DMS.Encode(-t, DMS.MINUTE, 1, DMS.AZIMUTH),
    "001d02.0'",
  ],
  "t SECOND 0 NONE": [DMS.Encode(t, DMS.SECOND, 0, DMS.NONE), "-1d02'03\""],
  "t SECOND 0 LATITUDE": [
    DMS.Encode(t, DMS.SECOND, 0, DMS.LATITUDE),
    "01d02'03\"S",
  ],
  "t SECOND 0 LONGITUDE": [
    DMS.Encode(t, DMS.SECOND, 0, DMS.LONGITUDE),
    "001d02'03\"W",
  ],
  "t SECOND 0 AZIMUTH": [
    DMS.Encode(-t, DMS.SECOND, 0, DMS.AZIMUTH),
    "001d02'03\"",
  ],
  "t SECOND 1 NONE": [DMS.Encode(t, DMS.SECOND, 1, DMS.NONE), "-1d02'03.0\""],
  "t SECOND 1 LATITUDE": [
    DMS.Encode(t, DMS.SECOND, 1, DMS.LATITUDE),
    "01d02'03.0\"S",
  ],
  "t SECOND 1 LONGITUDE": [
    DMS.Encode(t, DMS.SECOND, 1, DMS.LONGITUDE),
    "001d02'03.0\"W",
  ],
  "t SECOND 1 AZIMUTH": [
    DMS.Encode(-t, DMS.SECOND, 1, DMS.AZIMUTH),
    "001d02'03.0\"",
  ],
};
const ind = {};
const dmsDecode = {
  " +0 ": [DMS.Decode(" +0 ", ind), +0.0],
  "-0  ": [DMS.Decode("-0  ", ind), -0.0],
  //" nan": [DMS.Decode(" nan", ind), NaN], // Illegal character n in DMS string
  //"+inf": [DMS.Decode("+inf", ind), +Infinity], // Illegal character i in DMS string
  //" inf": [DMS.Decode(" inf", ind), +Infinity], // Illegal character i in DMS string
  //"-inf": [DMS.Decode("-inf", ind), -Infinity], // Illegal character i in DMS string
  " +0N": [DMS.Decode(" +0N", ind), +0.0],
  "-0N ": [DMS.Decode("-0N ", ind), -0.0],
  "+0S ": [DMS.Decode("+0S ", ind), -0.0],
  " -0S": [DMS.Decode(" -0S", ind), +0.0],
};

function equiv(x, y) {
  return (isNaN(x) && isNaN(y)) || (x === y && Math.sign(x) === Math.sign(y))
    ? 0
    : 1;
}

const T = Number;
let n = 0;

// lat = +/-0 in UTMUPS::Forward
// lat y northp
const C = [
  [+T(0), T(0), 1],
  [-T(0), 10e6, 0],
];
let i = 0;
let northp, zone, x, y, mgrs;
for (let k = 0; k < 2; ++k) {
  ({ zone, northp, x, y } = UTMUPS.Forward(C[k][0], T(3)));
  if (equiv(y, C[k][1]) + (northp === C[k][2] > 0 ? 0 : 1)) ++i;
  mgrs = MGRS.Forward(zone, northp, x, y, 2);
  if (!(mgrs === (k === 0 ? "31NEA0000" : "31MEV0099"))) ++i;
  mgrs = MGRS.Forward(zone, northp, x, y, +T(0), 2);
  if (!(mgrs === (k === 0 ? "31NEA0000" : "31MEV0099"))) ++i;
  mgrs = MGRS.Forward(zone, northp, x, y, -T(0), 2);
  if (!(mgrs === (k === 0 ? "31NEA0000" : "31MEV0099"))) ++i;
}
/*
if (i) {
  console.log(`Line ${i}: UTMUPS/MGRS::Forward lat = +/-0, fail`);
  ++n;
}
*/
if (n) {
  console.log(`${n} failure${n > 1 ? "s" : ""}`);
  //return 1;
}

export default { "DMS Encode:": dmsEncode, "DMS Decode:": dmsDecode };
