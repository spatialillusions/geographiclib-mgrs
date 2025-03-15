/********************************************************
 * This is a replacement for proj4js mgrs that uses a
 * port of C++ GeographicLib. The added functionality
 * makes it support MGRS in UPS zones around the poles.
 ********************************************************/

import MGRS from "./src/mgrs.mjs";
import UTMUPS from "./src/utmups.mjs";

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
  /*
  // MGRS, centerPoint
  const mgrsReverse = MGRS.Reverse(mgrs, false);
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
  */
  throw new Error("inverse function not implemented");
};
//toPoint, takes an mgrs string, returns an array of '[lon,lat]'
GeographicLibMGRS.toPoint = function (mgrs, centerp) {
  /*
   * @param[in] mgrs MGRS string.
   * @param[in] centerp if true (default), return center of the MGRS square,
   *   else return SW (lower left) corner.
   * @exception GeographicErr if \e mgrs is illegal.
   *
   * @param[out] zone UTM zone (zero means UPS).
   * @param[out] northp hemisphere (true means north, false means south).
   * @param[out] x easting of point (meters).
   * @param[out] y northing of point (meters).
   * @param[out] prec precision relative to 100 km.
   * */
  const mgrsReverse = MGRS.Reverse(mgrs, centerp);
  //console.log(mgrs);
  //console.log(mgrsReverse);
  const mgrsLimits = false;
  /*
   * @param[in] zone the UTM zone (zero means UPS).
   * @param[in] northp hemisphere (true means north, false means south).
   * @param[in] x easting of point (meters).
   * @param[in] y northing of point (meters).
   * @param[in] mgrslimits if true enforce the stricter MGRS limits on the
   *   coordinates (default = false).
   * @exception GeographicErr if \e zone, \e x, or \e y is out of allowed
   *   range; this this case the arguments are unchanged.
   *
   * @param[out] lat latitude of point (degrees).
   * @param[out] lon longitude of point (degrees).
   * @param[out] gamma meridian convergence at point (degrees).
   * @param[out] k scale of projection at point.
   * */
  const utmupsReverse = UTMUPS.Reverse(
    mgrsReverse.zone,
    mgrsReverse.northp,
    mgrsReverse.x, //- 0.25,
    mgrsReverse.y, //- 1.5,
    mgrsLimits,
  );
  return [utmupsReverse.lon, utmupsReverse.lat];
};

export default GeographicLibMGRS;
