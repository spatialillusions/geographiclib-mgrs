import MGRS_lib from "./geographic-lib/mgrs.mjs";
import UTMUPS_lib from "./geographic-lib/utmups-old.mjs";

const MGRS = {};

//forward, takes an array of [lon,lat] and optional accuracy and returns an mgrs string
MGRS.forward = function (lonlat, accuracy) {
  return MGRS_lib.Forward(lonlat[1], lonlat[0], accuracy);
};
//inverse, takes an mgrs string and returns a bbox.
MGRS.inverse = function (mgrs) {
  const mgrsReverse = MGRS_lib.Reverse(mgrs, true);
  const utmupsReverse = UTMUPS_lib.Reverse(
    mgrsReverse.zone,
    mgrsReverse.northp,
    mgrsReverse.x,
    mgrsReverse.y,
    0,
    0,
    0,
    0,
  );
  return {
    north: utmupsReverse.lat,
    south: utmupsReverse.lat,
    east: utmupsReverse.lon,
    west: utmupsReverse.lon,
  };
};
//toPoint, takes an mgrs string, returns an array of '[lon,lat]'
MGRS.toPoint = function (mgrs, centerp) {
  const mgrsReverse = MGRS_lib.Reverse(mgrs, centerp || true);
  const mgrsLimits = false;
  const utmupsReverse = UTMUPS_lib.Reverse(
    mgrsReverse.zone,
    mgrsReverse.northp,
    mgrsReverse.x,
    mgrsReverse.y,
    mgrsLimits,
  );
  return [utmupsReverse.lon, utmupsReverse.lat];
};

export default MGRS;
