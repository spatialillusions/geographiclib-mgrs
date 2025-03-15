import fs from "fs";
import path from "path";
import MGRS from "../index.mjs";
let geotrans;

try {
  geotrans = fs.readFileSync(
    path.join("test", "geotrans3.9-output", "geoToMgrs_WE.txt"),
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
    "GeoTrans INPUT_COORDS LAT",
    "GeoTrans INPUT_COORDS LON",
    "GeoTrans EXPECTED OUTPUT",
    "GeoTrans CALCULATED OUTPUT",
    "GeographicLib CALCULATED OUTPUT",
  ].join("\t"),
];
let mgrs, result, lat, lon, latRef, lonRef, valid;
let pass = 0;
let fail = 0;
for (let i = 3; i < geotrans.length; i++) {
  if (!geotrans[i][10]) continue;
  // 11 column is the MGRS calculated by GeoTrans,
  // 10th and 11th columns are the "correct" coordinates
  latRef = geotrans[i][7];
  lonRef = geotrans[i][8];

  // we are just making sure we get the same result
  mgrs = geotrans[i][13].trim();

  const accuracy = 5;
  result = MGRS.forward([parseFloat(lonRef), parseFloat(latRef)], accuracy);

  valid = mgrs == result;
  if (!valid) {
    fail++;
    logging.push(
      [
        geotrans[i][7].trim(),
        geotrans[i][8].trim(),
        geotrans[i][10].trim(),
        geotrans[i][13].trim(),
        result,
      ].join("\t"),
    );
  } else {
    pass++;
  }
}

// Write logs of fails

const content = "Some content!";
try {
  fs.writeFileSync(
    path.join("test", "MGRSforward.fails.tsv"),
    logging.join("\n"),
  );
} catch (err) {
  console.error(err);
}

WE[`Passed ${pass}`] = [pass > 0, true];
WE[`Wrote ${fail} failed coordinates to MGRSforward.fails.tsv`] = [
  fail == 0,
  true,
];

export default {
  "Comparing GeograpicLib-mgrs.js to Geotrans": WE,
};
