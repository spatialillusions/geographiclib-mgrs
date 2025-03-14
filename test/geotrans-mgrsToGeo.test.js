import fs from "fs";
import MGRS from "../index.mjs";

let geotrans;
try {
  geotrans = fs.readFileSync(
    "./test/geotrans3.9-output/mgrsToGeo_WE.txt",
    "utf-8"
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
/*
const i = 400;
mgrs = geotrans[i][7].replace(" ", "");
point = MGRS.toPoint(mgrs, true);
lat = point[1].toFixed(6);
lon = point[0].toFixed(6);

latRef = geotrans[i][13];
lonRef = geotrans[i][14];
//*/
/*
WE[mgrs] = [
  { lat: lat, lon: lon },
  { lat: latRef, lon: lonRef },
];
*/

// .\GeoConvert_d.exe  -p 1 --input-string "33XVK9556495053"
// 81.016479 14.745563
point = MGRS.toPoint("33XVK9556495053", true);
lat = point[1].toFixed(6);
lon = point[0].toFixed(6);

WE["33XVK9556495053" + " geographiclib"] = [
  { lat: lat, lon: lon },
  { lat: "81.016479", lon: "14.745563" },
];

// Geoconvert outputs the expected MGRS
// .\GeoConvert_d.exe -m -p 0 --input-string "81.016475 14.745534"
// 33XVK9556395053

// .\GeoConvert_d.exe  -p 1 --input-string "31PGK5976098847"
// 9.028532 5.362851
/*
point = MGRS.toPoint("31PGK5976098847", true);
lat = point[1].toFixed(6);
lon = point[0].toFixed(6);

WE["31PGK5976098847" + " geographiclib"] = [
  { lat: lat, lon: lon },
  { lat: "9.028532", lon: "5.362851" },
];
*/
/*
// 9.028532 5.362851
WE[mgrs + " geographiclib"] = [
  { lat: lat, lon: lon },
  { lat: "9.028532", lon: "5.362851" },
];
*/

export default { "Geotrans MGRS to Geo WE": WE };
