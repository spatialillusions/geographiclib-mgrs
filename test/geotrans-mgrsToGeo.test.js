import fs from "fs";
import MGRS from "../index.mjs";

// We use the same precision that proj4js mgrs uses for their tests
const precision = 0.0000015;
function closeTo(num1, num2, precision) {
  //console.log("0.0000015");
  //console.log(Math.abs(num1 - num2));
  console.log(num1, num2);
  console.log(Math.abs(num1 - num2));
  return Math.abs(num1 - num2) < precision;
}

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
let mgrs, point, lat, lon, latRef, lonRef, valid;

const i = 400;
mgrs = geotrans[i][7].replace(" ", "");
point = MGRS.toPoint(mgrs, true);
lat = point[1];
lon = point[0];
latRef = geotrans[i][10];
lonRef = geotrans[i][11];

valid = closeTo(lat, latRef, precision) && closeTo(lon, lonRef, precision);
if (valid) {
  WE[mgrs] = [true, valid];
} else {
  WE[mgrs] = [
    { lat: lat, lon: lon },
    { lat: latRef, lon: lonRef },
  ];
}

//*
// .\GeoConvert_d.exe  -p 1 --input-string "33XVK9556495053"
// 81.016479 14.745563
point = MGRS.toPoint("33XVK9556495053", true);
lat = point[1];
lon = point[0];
valid =
  closeTo(lat, 81.016479, precision) && closeTo(lon, 14.745563, precision);

if (valid) {
  WE[mgrs] = [true, valid];
} else {
  WE["33XVK9556495053  geographiclib"] = [
    { lat: lat, lon: lon },
    { lat: "81.016479", lon: "14.745563" },
  ];
}

//*/

export default { "Geotrans MGRS to Geo WE": WE };
