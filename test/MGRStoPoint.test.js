import fs from "fs";
import path from "path";
import MGRS from "../index.mjs";

// GeoTrans sets the precision for MGRS in
// MGRSorUSNGCoordinates.cpp to tenthOfSecond
const precision = 1 / 60 / 60 / 10;

function closeTo(num1, num2, precision) {
  return Math.abs(num1 - num2) <= precision;
}

let geotrans;

try {
  geotrans = fs.readFileSync(
    path.join("test", "geotrans3.9-output", "mgrsToGeo_WE.txt"),
    "utf-8",
  );
} catch (err) {
  console.error(err);
}

geotrans = geotrans.split(/\r?\n/);
for (let i = 0; i < geotrans.length; i++) {
  geotrans[i] = geotrans[i].split("\t");
}
const WE = {};
const logging = [
  [
    "GeoTrans INPUT_COORDS MGRS",
    "GeoTrans EXPECTED OUTPUT LAT",
    "GeoTrans EXPECTED OUTPUT LON",
    "GeoTrans CALCULATED OUTPUT LAT",
    "GeoTrans CALCULATED OUTPUT LON",
    "GeographicLib CALCULATED OUTPUT LAT",
    "GeographicLib CALCULATED OUTPUT LON",
  ].join("\t"),
];

let mgrs, point, lat, lon, latRef, lonRef, valid;
let pass = 0;
let fail = 0;
let geotransEqual = 0;
for (let i = 3; i < geotrans.length; i++) {
  if (!geotrans[i][7]) continue;
  // 7 column is the MGRS string
  mgrs = geotrans[i][7].trim();
  // 10th and 11th columns are the "correct" coordinates
  latRef = geotrans[i][10];
  lonRef = geotrans[i][11];

  // Geotrans uses the lower left corner for MGRS and not the center
  const centerpoint = false;
  point = MGRS.toPoint(mgrs, centerpoint);
  lat = point[1].toFixed(6);
  lon = point[0].toFixed(6);

  valid = closeTo(lat, latRef, precision) && closeTo(lon, lonRef, precision);
  if (!valid) {
    fail++;
    logging.push(
      [
        geotrans[i][7].trim(),
        geotrans[i][10],
        geotrans[i][11],
        geotrans[i][13],
        geotrans[i][14],
        lat,
        lon,
      ].join("\t"),
    );
    // Our result is more than 1/10 second from the expexted result, but
    // our result is equal to geotrans result
    if (geotrans[i][13] == lat && geotrans[i][14] == lon) geotransEqual++;
  } else {
    pass++;
  }
}

// Write logs of fails

const content = "Some content!";
try {
  fs.writeFileSync(
    path.join("test", "MGRStoPoint.fails.tsv"),
    logging.join("\n"),
  );
} catch (err) {
  console.error(err);
}

WE[`${pass} coordinates less than 1/10 second from expected result`] = [
  pass > 0,
  true,
];
WE[`${fail} coordinates more than 1/10 second from expected result`] = [
  true,
  true,
];
WE[
  `${geotransEqual}/${fail} of those coordinates is equal to the Geotrans result`
] = [geotransEqual, fail];

// Compared to GeographicLib C++ 2.7.
const geographiclib = {};
for (const [mgrsRef, centerp, latRef, lonRef] of [
  // ./GeoConvert -p 9 --input-string 33XVK9556495053
  ["33XVK9556495053", true, 81.01647905419107, 14.74556283486876],
  // SW corners on the 180 meridian, at both poles
  // ./GeoConvert -p 9 -n --input-string ZAJ0000011026
  ["ZAJ0000011026", false, 89.00000468441212, 180],
  ["BAL0000088973", false, -88.99999567799381, 180],
]) {
  const [lonGot, latGot] = MGRS.toPoint(mgrsRef, centerp);
  geographiclib[`${mgrsRef} ${centerp ? "center" : "corner"}`] = [
    closeTo(latGot, latRef, precision) && closeTo(lonGot, lonRef, precision),
    true,
  ];
}

export default {
  "Comparing GeograpicLib-mgrs.js to Geotrans": WE,
  "Comparing GeograpicLib-mgrs.js to GeographicLib C++": geographiclib,
};
