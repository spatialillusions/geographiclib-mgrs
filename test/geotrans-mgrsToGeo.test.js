import fs from "fs";
import MGRS from "../index.mjs";

let geotrans;
try {
  geotrans = fs.readFileSync(
    "./test/geotrans3.9-output/mgrsToGeo_WE.txt",
    "utf-8",
  );
} catch (err) {
  console.error(err);
}

geotrans = geotrans.split("\n");
for (let i = 0; i < geotrans.length; i++) {
  geotrans[i] = geotrans[i].split("\t");
}

const WE = {};
let mgrs, point, lat, lon, latRef, lonRef;

const i = 300;
mgrs = geotrans[i][7].replace(" ", "");
point = MGRS.toPoint(mgrs, true);
lat = point[1].toFixed(6);
lon = point[0].toFixed(6);
latRef = geotrans[i][10];
lonRef = geotrans[i][11];

WE[mgrs] = [
  { lat: lat, lon: lon },
  { lat: latRef, lon: lonRef },
];

WE[mgrs + " geographiclib"] = [
  { lat: lat, lon: lon },
  { lat: "9.042052", lon: "7.180482" },
];

// 9.042052 7.180482
export default { "Geotrans MGRS to Geo WE": WE };
