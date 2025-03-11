import Constants from "./constants.mjs";
import MATH from "./math.mjs";

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

  CentralMeridian(zone) {
    return 6 * zone - 183;
  },

  StandardZone(lat, lon, setzone = this.zonespec.STANDARD) {
    if (
      !(
        setzone >= this.zonespec.MINPSEUDOZONE &&
        setzone <= this.zonespec.MAXZONE
      )
    )
      throw new Error("Illegal zone requested " + setzone);
    if (setzone >= this.zonespec.MINZONE || setzone === this.zonespec.INVALID)
      return setzone;
    if (isNaN(lat) || isNaN(lon)) return this.zonespec.INVALID;
    if (setzone === this.zonespec.UTM || (lat >= -80 && lat < 84)) {
      let ilon = Math.floor(MATH.AngNormalize(lon));
      if (ilon === MATH.hd) ilon = -MATH.hd;
      let zone = Math.floor((ilon + 186) / 6);
      let band = MGRS.LatitudeBand(lat);
      if (band === 7 && zone === 31 && ilon >= 3) zone = 32;
      else if (band === 9 && ilon >= 0 && ilon < 42)
        zone = 2 * Math.floor((ilon + 183) / 12) + 1;
      return zone;
    } else return this.zonespec.UPS;
  },

  UTMShift() {
    return 10000000;
  },

  EquatorialRadius() {
    return Constants.WGS84_a();
  },

  Flattening() {
    return Constants.WGS84_f();
  },

  zonespec: {
    MINPSEUDOZONE: -4,
    INVALID: -4,
    MATCH: -3,
    UTM: -2,
    STANDARD: -1,
    MAXPSEUDOZONE: -1,
    MINZONE: 0,
    UPS: 0,
    MINUTMZONE: 1,
    MAXUTMZONE: 60,
    MAXZONE: 60,
  },
};

export default UTMUPS;
