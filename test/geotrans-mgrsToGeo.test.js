import fs from "fs";
import MGRS from "../index.mjs";

// We use the same precision that proj4js mgrs uses for their tests
const precision = 0.0000015;
function closeTo(num1, num2, precision) {
  console.log(num1, num2);
  console.log(Math.abs(num1 - num2));
  console.log(Math.abs(num1 - num2) < precision);
  return Math.abs(num1 - num2) < precision;
}

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
let mgrs, point, lat, lon, latRef, lonRef, valid;
//*
const i = 200;
mgrs = geotrans[i][7].replace(" ", "");
point = MGRS.toPoint(mgrs, true);
lat = point[1];
lon = point[0];
latRef = geotrans[i][10];
lonRef = geotrans[i][11];

valid = closeTo(lat, latRef, precision) && closeTo(lon, lonRef, precision);
WE[mgrs] = valid
  ? [true, valid]
  : [
      { lat: lat, lon: lon },
      { lat: latRef, lon: lonRef },
    ];

//*/

//*
// .\GeoConvert_d.exe  -p 1 --input-string "33XVK9556495053"
//  81.01648 14.74556
latRef = 81.016479;
lonRef = 14.745563;
point = MGRS.toPoint("33XVK9556495053", true);
lat = point[1];
lon = point[0];
valid = closeTo(lat, latRef, precision) && closeTo(lon, lonRef, precision);

WE["33XVK9556495053  geographiclib compare"] = valid
  ? [true, valid]
  : [
      { lat: lat, lon: lon },
      { lat: latRef, lon: lonRef },
    ];

closeTo(-36.098352, -36.09835, precision);
closeTo(-0.332181, -0.33218, precision);
//*/

export default { "Geotrans MGRS to Geo WE": WE };
