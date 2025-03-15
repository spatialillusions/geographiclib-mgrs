import MGRS from "./mgrs-shared.mjs";
import CONSTANTS from "./constants.mjs";
import TransverseMercator from "./transverse-mercator.mjs";
import PolarStereographic from "./polar-stereographic.mjs";
import MATH from "./math.mjs";
import Utility from "./utility.mjs";

const UTMUPS = {
  falseeasting_: [500000, 500000, 2000000, 2000000],
  falsenorthing_: [0, 10000000, 0, 10000000],
  mineasting_: [100000, 100000, 100000, 100000],
  maxeasting_: [900000, 900000, 900000, 900000],
  minnorthing_: [0, 0, 0, 0],
  maxnorthing_: [9600000, 9600000, 9600000, 9600000],
  epsg01N: 32601, // EPSG code for UTM 01N
  epsg60N: 32660, // EPSG code for UTM 60N
  epsgN: 32661, // EPSG code for UPS N
  epsg01S: 32701, // EPSG code for UTM 01S
  epsg60S: 32760, // EPSG code for UTM 60S
  epsgS: 32761, // EPSG code for UPS S

  /**
   * The smallest pseudo-zone number.
   **********************************************************************/
  MINPSEUDOZONE: -4,
  /**
   * A marker for an undefined or invalid zone.  Equivalent to NaN.
   **********************************************************************/
  INVALID: -4,
  /**
   * If a coordinate already include zone information (e.g., it is an MGRS
   * coordinate), use that, otherwise apply the UTMUPS::STANDARD rules.
   **********************************************************************/
  MATCH: -3,
  /**
   * Apply the standard rules for UTM zone assigment extending the UTM zone
   * to each pole to give a zone number in [1, 60].  For example, use UTM
   * zone 38 for longitude in [42&deg;, 48&deg;).  The rules include the
   * Norway and Svalbard exceptions.
   **********************************************************************/
  UTM: -2,
  /**
   * Apply the standard rules for zone assignment to give a zone number in
   * [0, 60].  If the latitude is not in [&minus;80&deg;, 84&deg;), then
   * use UTMUPS::UPS = 0, otherwise apply the rules for UTMUPS::UTM.  The
   * tests on latitudes and longitudes are all closed on the lower end open
   * on the upper.  Thus for UTM zone 38, latitude is in [&minus;80&deg;,
   * 84&deg;) and longitude is in [42&deg;, 48&deg;).
   **********************************************************************/
  STANDARD: -1,
  /**
   * The largest pseudo-zone number.
   **********************************************************************/
  MAXPSEUDOZONE: -1,
  /**
   * The smallest physical zone number.
   **********************************************************************/
  MINZONE: 0,
  /**
   * The zone number used for UPS
   **********************************************************************/
  UPS: 0,
  /**
   * The smallest UTM zone number.
   **********************************************************************/
  MINUTMZONE: 1,
  /**
   * The largest UTM zone number.
   **********************************************************************/
  MAXUTMZONE: 60,
  /**
   * The largest physical zone number.
   **********************************************************************/
  MAXZONE: 60,
};
UTMUPS.CentralMeridian = function (zone) {
  return 6 * zone - 183;
};
UTMUPS.UTMShift = function () {
  return 10000000;
};
UTMUPS.EquatorialRadius = function () {
  return CONSTANTS.WGS84_a();
};
UTMUPS.Flattening = function () {
  return CONSTANTS.WGS84_f();
};

UTMUPS.falseeasting_ = [
  MGRS.upseasting_ * MGRS.tile_,
  MGRS.upseasting_ * MGRS.tile_,
  MGRS.utmeasting_ * MGRS.tile_,
  MGRS.utmeasting_ * MGRS.tile_,
];

UTMUPS.falsenorthing_ = [
  MGRS.upseasting_ * MGRS.tile_,
  MGRS.upseasting_ * MGRS.tile_,
  MGRS.maxutmSrow_ * MGRS.tile_,
  MGRS.minutmNrow_ * MGRS.tile_,
];

UTMUPS.mineasting_ = [
  MGRS.minupsSind_ * MGRS.tile_,
  MGRS.minupsNind_ * MGRS.tile_,
  MGRS.minutmcol_ * MGRS.tile_,
  MGRS.minutmcol_ * MGRS.tile_,
];

UTMUPS.maxeasting_ = [
  MGRS.maxupsSind_ * MGRS.tile_,
  MGRS.maxupsNind_ * MGRS.tile_,
  MGRS.maxutmcol_ * MGRS.tile_,
  MGRS.maxutmcol_ * MGRS.tile_,
];

UTMUPS.minnorthing_ = [
  MGRS.minupsSind_ * MGRS.tile_,
  MGRS.minupsNind_ * MGRS.tile_,
  MGRS.minutmSrow_ * MGRS.tile_,
  (MGRS.minutmNrow_ + MGRS.minutmSrow_ - MGRS.maxutmSrow_) * MGRS.tile_,
];

UTMUPS.maxnorthing_ = [
  MGRS.maxupsSind_ * MGRS.tile_,
  MGRS.maxupsNind_ * MGRS.tile_,
  (MGRS.maxutmSrow_ + MGRS.maxutmNrow_ - MGRS.minutmNrow_) * MGRS.tile_,
  MGRS.maxutmNrow_ * MGRS.tile_,
];

UTMUPS.StandardZone = function (lat, lon, setzone) {
  setzone = setzone || this.STANDARD;
  if (!(setzone >= this.MINPSEUDOZONE && setzone <= this.MAXZONE))
    throw new Error("Illegal zone requested " + Utility.str(setzone));
  if (setzone >= this.MINZONE || setzone == this.INVALID) return setzone;
  if (isNaN(lat) || isNaN(lon)) return this.INVALID;
  if (setzone == this.UTM || (lat >= -80 && lat < 84)) {
    let ilon = Math.floor(MATH.AngNormalize(lon));
    if (ilon == MATH.hd) ilon = -MATH.hd;
    let zone = Math.floor((ilon + 186) / 6);
    let band = MGRS.LatitudeBand(lat);
    if (band == 7 && zone == 31 && ilon >= 3) zone = 32;
    else if (band == 9 && ilon >= 0 && ilon < 42)
      zone = 2 * Math.floor((ilon + 183) / 12) + 1;
    return zone;
  } else return this.UPS;
};

/**
 * Forward projection, from geographic to UTM/UPS.
 *
 * @param[in] lat latitude of point (degrees).
 * @param[in] lon longitude of point (degrees).
 * @param[in] setzone zone override (optional).
 * @param[in] mgrslimits if true enforce the stricter MGRS limits on the
 *   coordinates (default = false).
 * @exception GeographicErr if \e lat is not in [&minus;90&deg;,
 *   90&deg;].
 * @exception GeographicErr if the resulting \e x or \e y is out of allowed
 *   range (see Reverse); in this case, these arguments are unchanged.
 *
 * 
 * @param[out] zone the UTM zone (zero means UPS).
 * @param[out] northp hemisphere (true means north, false means south).
 * @param[out] x easting of point (meters).
 * @param[out] y northing of point (meters).
 * @param[out] gamma meridian convergence at point (degrees).
 * @param[out] k scale of projection at point.
 * 
 * If \e setzone is omitted, use the standard rules for picking the zone.
 * If \e setzone is given then use that zone if it is non-negative,
 * otherwise apply the rules given in UTMUPS::zonespec.  The accuracy of
 * the conversion is about 5nm.
 *
 * The northing \e y jumps by UTMUPS::UTMShift() when crossing the equator
 * in the southerly direction.  Sometimes it is useful to remove this
 * discontinuity in \e y by extending the "northern" hemisphere using
 * UTMUPS::Transfer:
 * \code
 double lat = -1, lon = 123;
int zone;
bool northp;
double x, y, gamma, k;
GeographicLib::UTMUPS::Forward(lat, lon, zone, northp, x, y, gamma, k);
GeographicLib::UTMUPS::Transfer(zone, northp, x, y,
                                zone, true,   x, y, zone);
northp = true;
\endcode
**********************************************************************/
UTMUPS.Forward = function (lat, lon, setzone, mgrslimits) {
  let zone, northp, x, y, gamma, k;
  if (Math.abs(lat) > Math.qd)
    throw new Error(
      "Latitude " +
        Utility.str(lat) +
        "d not in [-" +
        Math.qd +
        "d, " +
        Math.qd +
        "d]",
    );
  let northp1 = !MATH.signbit(lat);
  setzone = setzone; //|| this.MINPSEUDOZONE;
  let zone1 = this.StandardZone(lat, lon, setzone);
  if (zone1 == this.INVALID) {
    zone = zone1;
    northp = northp1;
    x = y = gamma = k = NaN;
    return { zone, northp, x, y, gamma, k };
  }
  let x1, y1, gamma1, k1;
  let utmp = zone1 != this.UPS;
  if (utmp) {
    let lon0 = this.CentralMeridian(zone1);
    let dlon = MATH.AngDiff(lon0, lon);
    if (!(dlon <= 60))
      throw new Error(
        "Longitude " +
          Utility.str(lon) +
          "d more than 60d from center of UTM zone " +
          Utility.str(zone1),
      );
    const result = TransverseMercator.UTM().Forward(lon0, lat, lon);
    x1 = result.x;
    y1 = result.y;
    gamma1 = result.gamma;
    k1 = result.k;
  } else {
    if (Math.abs(lat) < 70)
      throw new Error(
        "Latitude " +
          Utility.str(lat) +
          "d more than 20d from " +
          (northp1 ? "N" : "S") +
          " pole",
      );
    const result = PolarStereographic.UPS().Forward(northp1, lat, lon);
    x1 = result.x;
    y1 = result.y;
    gamma1 = result.gamma;
    k1 = result.k;
    //return { zone: zone1, northp: northp1, x: x1, y: y1, gamma: gamma1, k: k1 };
  }
  let ind = (utmp ? 2 : 0) + (northp1 ? 1 : 0);
  x1 += this.falseeasting_[ind];

  y1 += this.falsenorthing_[ind];
  if (!this.CheckCoords(zone1 != this.UPS, northp1, x1, y1, mgrslimits, false))
    throw new Error(
      "Latitude " +
        Utility.str(lat) +
        ", longitude " +
        Utility.str(lon) +
        " out of legal range for " +
        (utmp ? "UTM zone " + Utility.str(zone1) : "UPS"),
    );

  zone = zone1;
  northp = northp1;
  x = x1;
  y = y1;
  gamma = gamma1;
  k = k1;

  return { zone, northp, x, y, gamma, k };
};

/**
 * Reverse projection, from  UTM/UPS to geographic.
 *
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
 *
 * The accuracy of the conversion is about 5nm.
 *
 * UTM eastings are allowed to be in the range [0km, 1000km], northings are
 * allowed to be in in [0km, 9600km] for the northern hemisphere and in
 * [900km, 10000km] for the southern hemisphere.  However UTM northings
 * can be continued across the equator.  So the actual limits on the
 * northings are [-9100km, 9600km] for the "northern" hemisphere and
 * [900km, 19600km] for the "southern" hemisphere.
 *
 * UPS eastings and northings are allowed to be in the range [1200km,
 * 2800km] in the northern hemisphere and in [700km, 3300km] in the
 * southern hemisphere.
 *
 * These ranges are 100km larger than allowed for the conversions to MGRS.
 * (100km is the maximum extra padding consistent with eastings remaining
 * non-negative.)  This allows generous overlaps between zones and UTM and
 * UPS.  If \e mgrslimits = true, then all the ranges are shrunk by 100km
 * so that they agree with the stricter MGRS ranges.  No checks are
 * performed besides these (e.g., to limit the distance outside the
 * standard zone boundaries).
 **********************************************************************/
UTMUPS.Reverse = function (zone, northp, x, y, mgrslimits) {
  let lat, lon, gamma, k;
  if (zone == this.INVALID || isNaN(x) || isNaN(y)) {
    lat = lon = gamma = k = NaN;
    return;
  }
  if (!(zone >= this.MINZONE && zone <= this.MAXZONE))
    throw new Error("Zone " + Utility.str(zone) + " not in range [0, 60]");
  let utmp = zone != this.UPS;
  this.CheckCoords(utmp, northp, x, y, mgrslimits);
  let ind = (utmp ? 2 : 0) + (northp ? 1 : 0);
  x -= this.falseeasting_[ind];
  y -= this.falsenorthing_[ind];
  if (utmp) {
    ({ lat, lon, gamma, k } = TransverseMercator.UTM().Reverse(
      this.CentralMeridian(zone),
      x,
      y,
    ));
  } else {
    ({ lat, lon, gamma, k } = PolarStereographic.UPS().Reverse(northp, x, y));
  }
  return { lat, lon, gamma, k };
};

UTMUPS.CheckCoords = function (utmp, northp, x, y, mgrslimits, throwp) {
  let slop = mgrslimits ? 0 : MGRS.tile_;
  let ind = (utmp ? 2 : 0) + (northp ? 1 : 0);
  if (x < this.mineasting_[ind] - slop || x > this.maxeasting_[ind] + slop) {
    if (!throwp) return false;
    throw new Error(
      "Easting " +
        Utility.str(x / 1000) +
        "km not in " +
        (mgrslimits ? "MGRS/" : "") +
        (utmp ? "UTM" : "UPS") +
        " range for " +
        (northp ? "N" : "S") +
        " hemisphere [" +
        Utility.str((this.mineasting_[ind] - slop) / 1000) +
        "km, " +
        Utility.str((this.maxeasting_[ind] + slop) / 1000) +
        "km]",
    );
  }
  if (y < this.minnorthing_[ind] - slop || y > this.maxnorthing_[ind] + slop) {
    if (!throwp) return false;
    throw new Error(
      "Northing " +
        Utility.str(y / 1000) +
        "km not in " +
        (mgrslimits ? "MGRS/" : "") +
        (utmp ? "UTM" : "UPS") +
        " range for " +
        (northp ? "N" : "S") +
        " hemisphere [" +
        Utility.str((this.minnorthing_[ind] - slop) / 1000) +
        "km, " +
        Utility.str((this.maxnorthing_[ind] + slop) / 1000) +
        "km]",
    );
  }
  return true;
};

UTMUPS.Transfer = function (
  zonein,
  northpin,
  xin,
  yin,
  zoneout,
  northpout,
  xout,
  yout,
  zone,
) {
  let northp = northpin;
  if (zonein != zoneout) {
    let lat, lon, gamma, k;
    ({ lat, lon, gamma, k } = this.Reverse(zonein, northpin, xin, yin));
    let x, y, zone1, northp;
    ({ zone, northp, x, y, gamma, k } = this.Forward(
      lat,
      lon,
      zoneout == this.MATCH ? zonein : zoneout,
    ));
    if (zone1 == 0 && northp != northpout)
      throw new Error(
        "Attempt to transfer UPS coordinates between hemispheres",
      );
    //zone.value = zone1;
    //xout.value = x;
    //yout.value = y;
  } else {
    if (zoneout == 0 && northp != northpout)
      throw new Error(
        "Attempt to transfer UPS coordinates between hemispheres",
      );
    //zone.value = zoneout;
    //xout.value = xin;
    //yout.value = yin;
  }
  if (northp != northpout) yout.value += (northpout ? -1 : 1) * MGRS.utmNshift_;
};

UTMUPS.DecodeZone = function (zonestr, zone, northp) {
  let zlen = zonestr.length;
  if (zlen == 0) throw new Error("Empty zone specification");
  if (zlen > 7)
    throw new Error("More than 7 characters in zone specification " + zonestr);

  let c = zonestr;
  let q;
  let zone1 = parseInt(c);
  if (zone1 == this.UPS) {
    if (!(q == c))
      throw new Error(
        "Illegal zone 0 in " + zonestr + ", use just the hemisphere for UPS",
      );
  } else if (!(zone1 >= this.MINUTMZONE && zone1 <= this.MAXUTMZONE))
    throw new Error("Zone " + Utility.str(zone1) + " not in range [1, 60]");
  else if (!/\d/.test(zonestr[0]))
    throw new Error("Must use unsigned number for zone " + Utility.str(zone1));
  else if (q - c > 2)
    throw new Error(
      "More than 2 digits use to specify zone " + Utility.str(zone1),
    );

  let hemi = zonestr.substring(q - c).toLowerCase();
  if (q == c && (hemi == "inv" || hemi == "invalid")) {
    zone.value = this.INVALID;
    northp.value = false;
    return;
  }
  let northp1 = hemi == "north" || hemi == "n";
  if (!(northp1 || hemi == "south" || hemi == "s"))
    throw new Error(
      "Illegal hemisphere " +
        hemi +
        " in " +
        zonestr +
        ", specify north or south",
    );
  zone.value = zone1;
  northp.value = northp1;
};

UTMUPS.EncodeZone = function (zone, northp, abbrev) {
  if (zone == this.INVALID) return abbrev ? "inv" : "invalid";
  if (!(zone >= this.MINZONE && zone <= this.MAXZONE))
    throw new Error("Zone " + Utility.str(zone) + " not in range [0, 60]");
  let os = [];
  if (zone != this.UPS) os.push(zone.toString().padStart(2, "0"));
  os.push(abbrev ? (northp ? "n" : "s") : northp ? "north" : "south");
  return os.join("");
};

UTMUPS.DecodeEPSG = function (epsg, zone, northp) {
  northp.value = false;
  if (epsg >= this.epsg01N && epsg <= this.epsg60N) {
    zone.value = epsg - this.epsg01N + this.MINUTMZONE;
    northp.value = true;
  } else if (epsg == this.epsgN) {
    zone.value = this.UPS;
    northp.value = true;
  } else if (epsg >= this.epsg01S && epsg <= this.epsg60S) {
    zone.value = epsg - this.epsg01S + this.MINUTMZONE;
  } else if (epsg == this.epsgS) {
    zone.value = this.UPS;
  } else {
    zone.value = this.INVALID;
  }
};

UTMUPS.EncodeEPSG = function (zone, northp) {
  let epsg = -1;
  if (zone == this.UPS) epsg = this.epsgS;
  else if (zone >= this.MINUTMZONE && zone <= this.MAXUTMZONE)
    epsg = zone - this.MINUTMZONE + this.epsg01S;
  if (epsg >= 0 && northp) epsg += this.epsgN - this.epsgS;
  return epsg;
};

UTMUPS.UTMShift = function () {
  return MGRS.utmNshift_;
};

export default UTMUPS;
