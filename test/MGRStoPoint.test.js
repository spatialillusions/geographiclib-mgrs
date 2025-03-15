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
  lat = point[1];
  lon = point[0];

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
        lat.toFixed(6),
        lon.toFixed(6),
      ].join("\t"),
    );
    //*/
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

WE[`Passed ${pass}`] = [pass > 0, true];
WE[`Wrote ${fail} failed coordinates to MGRStoPoint.fails.tsv`] = [true, true];

/*
const geographiclib = {};
// .\GeoConvert_d.exe  -p 1 --input-string "33XVK9556495053"
//  81.01648 14.74556
latRef = 81.016479;
lonRef = 14.745563;
point = MGRS.toPoint("33XVK9556495053", true);
lat = point[1];
lon = point[0];
valid = closeTo(lat, latRef, precision) && closeTo(lon, lonRef, precision);

geographiclib["33XVK9556495053"] = valid
  ? [true, valid]
  : [
      { lat: lat, lon: lon },
      { lat: latRef, lon: lonRef },
    ];
*/

export default {
  "Comparing GeograpicLib-mgrs.js to Geotrans": WE,
  //"Comparing GeograpicLib-mgrs.js to GeographicLib C++": geographiclib,
};
