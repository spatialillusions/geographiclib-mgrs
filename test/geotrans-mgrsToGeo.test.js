import fs from "fs";
import path from "path";
import MGRS from "../index.mjs";

// GeoTrans sets the precision for MGRS in
// MGRSorUSNGCoordinates.cpp to tenthOfSecond
const precision = 1 / 60 / 60 / 10;

function closeTo(num1, num2, precision) {
  return Math.abs(num1 - num2) < precision;
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
const logging = [];
let mgrs, point, lat, lon, latRef, lonRef, valid;
let pass = 0;
let fail = 0;
//*
geotrans[0].push("GeograpicLib LAT");
geotrans[0].push("GeograpicLib LON");
logging.push(geotrans[0].join("\t"));
logging.push(geotrans[1].join("\t"));
//*/
for (let i = 3; i < geotrans.length; i++) {
  if (!geotrans[i][7]) continue;
  // 7 column is the MGRS string
  mgrs = geotrans[i][7].trim();
  point = MGRS.toPoint(mgrs, true);
  lat = point[1];
  lon = point[0];
  // 10th and 11th columns are the "correct" coordinates
  latRef = geotrans[i][10];
  lonRef = geotrans[i][11];

  valid = closeTo(lat, latRef, precision) && closeTo(lon, lonRef, precision);
  if (!valid) {
    fail++;
    /*
    WE[mgrs] = [
      { lat: lat, lon: lon },
      { lat: latRef, lon: lonRef },
    ];
    //*/
    //*
    geotrans[i].push(lat);
    geotrans[i].push(lon);

    logging.push(geotrans[i].join("\t"));
    //*/
  } else {
    pass++;
  }
}

// Write logs of fails

const content = "Some content!";
try {
  fs.writeFileSync(
    path.join("test", "geotrans-mgrsToGeo.fails.tsv"),
    logging.join("\n"),
  );
} catch (err) {
  console.error(err);
}

WE[`Passed ${pass}`] = [pass > 0, true];
WE[`Wrote ${fail} failed coordinates to geotrans-mgrsToGeo.fails.tsv`] = [
  fail == 0,
  true,
];

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

export default {
  "Comparing to Geotrans": WE,
  "Comparing to GeographicLib C++": geographiclib,
};
