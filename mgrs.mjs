import MGRS from "./geographic-lib/mgrs.mjs";
import UTMUPS from "./geographic-lib/utmups.mjs";

const GeographicLibMGRS = {};

//forward, takes an array of [lon,lat] and optional accuracy and returns an GeographicLibMGRS string
GeographicLibMGRS.forward = function (lonlat, accuracy) {
  // lat, lon, zone, mgrslimits
  const utmupsForward = UTMUPS.Forward(lonlat[1], lonlat[0], false, false);
  // zone, northp, x, y, prec
  return MGRS.Forward(
    utmupsForward.zone,
    utmupsForward.northp,
    utmupsForward.x,
    utmupsForward.y,
    accuracy,
  );
};
//inverse, takes an mgrs string and returns a bbox.
// TODO this is not working as expected
GeographicLibMGRS.inverse = function (mgrs) {
  // MGRS, centerPoint
  const mgrsReverse = MGRS.Reverse(mgrs, true);
  //zone, northp, x, y, mgrslimits
  const utmupsReverse = UTMUPS.Reverse(
    mgrsReverse.zone,
    mgrsReverse.northp,
    mgrsReverse.x,
    mgrsReverse.y,
    false,
  );
  return {
    north: utmupsReverse.lat,
    south: utmupsReverse.lat,
    east: utmupsReverse.lon,
    west: utmupsReverse.lon,
  };
};
//toPoint, takes an mgrs string, returns an array of '[lon,lat]'
GeographicLibMGRS.toPoint = function (mgrs, centerp) {
  // MGRS, centerPoint
  const mgrsReverse = MGRS.Reverse(mgrs, centerp || true);
  const mgrsLimits = false;
  //zone, northp, x, y, mgrslimits
  const utmupsReverse = UTMUPS.Reverse(
    mgrsReverse.zone,
    mgrsReverse.northp,
    mgrsReverse.x,
    mgrsReverse.y,
    mgrsLimits,
  );
  return [utmupsReverse.lon, utmupsReverse.lat];
};

export default GeographicLibMGRS;
