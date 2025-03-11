import MGRS from "./MGRS.mjs";
import CONSTANTS from "../includes/constants.mjs";
import TransverseMercator from "./TransverseMercator.mjs";
import PolarStereographic from "./PolarStereographic.mjs";
import MATH from "../includes/math.mjs";
import Utility from "./Utility.mjs";

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

UTMUPS.Forward = function (
  lat,
  lon,
  zone,
  northp,
  x,
  y,
  gamma,
  k,
  setzone,
  mgrslimits,
) {
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
  let zone1 = this.StandardZone(lat, lon, setzone);
  if (zone1 == this.INVALID) {
    zone.value = zone1;
    northp.value = northp1;
    x.value = y.value = gamma.value = k.value = NaN;
    return;
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
    TransverseMercator.UTM().Forward(
      lon0,
      lat,
      lon,
      (x1 = {}),
      (y1 = {}),
      (gamma1 = {}),
      (k1 = {}),
    );
  } else {
    if (Math.abs(lat) < 70)
      throw new Error(
        "Latitude " +
          Utility.str(lat) +
          "d more than 20d from " +
          (northp1 ? "N" : "S") +
          " pole",
      );
    PolarStereographic.UPS().Forward(
      northp1,
      lat,
      lon,
      (x1 = {}),
      (y1 = {}),
      (gamma1 = {}),
      (k1 = {}),
    );
  }
  let ind = (utmp ? 2 : 0) + (northp1 ? 1 : 0);
  console.log(x1);
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

UTMUPS.Reverse = function (zone, northp, x, y, lat, lon, gamma, k, mgrslimits) {
  if (zone == this.INVALID || isNaN(x) || isNaN(y)) {
    lat.value = lon.value = gamma.value = k.value = NaN;
    return;
  }
  if (!(zone >= this.MINZONE && zone <= this.MAXZONE))
    throw new Error("Zone " + Utility.str(zone) + " not in range [0, 60]");
  let utmp = zone != this.UPS;
  this.CheckCoords(utmp, northp, x, y, mgrslimits);
  let ind = (utmp ? 2 : 0) + (northp ? 1 : 0);
  x -= this.falseeasting_[ind];
  y -= this.falsenorthing_[ind];
  if (utmp)
    TransverseMercator.UTM().Reverse(
      this.CentralMeridian(zone),
      x,
      y,
      (lat = {}),
      (lon = {}),
      (gamma = {}),
      (k = {}),
    );
  else
    PolarStereographic.UPS().Reverse(
      northp,
      x,
      y,
      (lat = {}),
      (lon = {}),
      (gamma = {}),
      (k = {}),
    );
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
    let lat, lon;
    this.Reverse(zonein, northpin, xin, yin, (lat = {}), (lon = {}));
    let x, y, zone1;
    this.Forward(
      lat,
      lon,
      (zone1 = {}),
      (northp = {}),
      (x = {}),
      (y = {}),
      zoneout == this.MATCH ? zonein : zoneout,
    );
    if (zone1 == 0 && northp != northpout)
      throw new Error(
        "Attempt to transfer UPS coordinates between hemispheres",
      );
    zone.value = zone1;
    xout.value = x;
    yout.value = y;
  } else {
    if (zoneout == 0 && northp != northpout)
      throw new Error(
        "Attempt to transfer UPS coordinates between hemispheres",
      );
    zone.value = zoneout;
    xout.value = xin;
    yout.value = yin;
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
